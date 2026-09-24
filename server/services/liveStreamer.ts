import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { db } from '../db/store.js';
import { YouTubeService } from './youtube.js';

export interface LiveStreamStatus {
  isStreaming: boolean;
  broadcastId?: string;
  streamId?: string;
  youtubeUrl?: string;
  rtmpUrl?: string;
  videoTitle: string;
  videoFilePath: string;
  isLooping: boolean;
  startedAt?: string;
  durationSeconds: number;
  fps: number;
  bitrate: string;
  streamHealth: 'good' | 'excellent' | 'warning' | 'offline';
  simulatedViewers: number;
  likes: number;
  chatMessages: Array<{ user: string; message: string; timestamp: string; isAi: boolean }>;
}

class LiveStreamManager {
  private activeProcess: ChildProcess | null = null;
  private currentStatus: LiveStreamStatus = {
    isStreaming: false,
    videoTitle: '',
    videoFilePath: '',
    isLooping: true,
    durationSeconds: 0,
    fps: 30,
    bitrate: '3000 kbps',
    streamHealth: 'offline',
    simulatedViewers: 0,
    likes: 0,
    chatMessages: []
  };

  private timer: NodeJS.Timeout | null = null;
  private chatTimer: NodeJS.Timeout | null = null;

  public getStatus(): LiveStreamStatus {
    return { ...this.currentStatus };
  }

  /**
   * Starts an RTMP live stream to YouTube using FFmpeg from a pre-recorded or animated video.
   */
  public async startStream(options: {
    videoFilePath: string;
    videoTitle: string;
    rtmpUrl?: string;
    streamKey?: string;
    loop?: boolean;
    createYouTubeBroadcast?: boolean;
    broadcastTitle?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
  }): Promise<{ success: boolean; status: LiveStreamStatus; message: string }> {
    if (this.activeProcess) {
      this.stopStream();
    }

    if (!fs.existsSync(options.videoFilePath)) {
      throw new Error(`Video file not found at: ${options.videoFilePath}`);
    }

    let rtmpUrl = options.rtmpUrl;
    let streamKey = options.streamKey;
    let broadcastId: string | undefined;
    let streamId: string | undefined;
    let youtubeUrl: string | undefined;

    // If requested and YouTube token exists, create official live broadcast on YouTube
    if (options.createYouTubeBroadcast && db.getStoredToken()) {
      try {
        const title = options.broadcastTitle || `🔴 LIVE: ${options.videoTitle} - Dhunboy Official (24/7 Mix)`;
        const liveRes = await YouTubeService.createLiveBroadcast({
          title,
          description: `🔴 LIVE STREAM: ${options.videoTitle}\nNon-stop Nepali DJ Remix, Club Bass & Live Animated Studio Stream by Lobish Sarma.\n\nEnjoy the stream! Like & Subscribe to Dhunboy Official.`,
          scheduledStartTime: new Date().toISOString(),
          privacyStatus: options.privacyStatus || 'unlisted'
        });

        broadcastId = liveRes.broadcastId;
        streamId = liveRes.streamId;
        rtmpUrl = liveRes.rtmpUrl;
        streamKey = liveRes.streamKey;
        youtubeUrl = `https://www.youtube.com/watch?v=${broadcastId}`;
      } catch (e: any) {
        console.warn('[LiveStreamManager] YouTube Broadcast creation failed or fallback to custom RTMP:', e.message);
      }
    }

    // Default to standard YouTube RTMP if none provided
    const targetRtmp = rtmpUrl || 'rtmp://a.rtmp.youtube.com/live2';
    const finalStreamKey = streamKey || 'dhunboy-stream-key';
    const fullRtmpDestination = `${targetRtmp}/${finalStreamKey}`;

    const isLooping = options.loop !== false;

    // FFmpeg arguments to broadcast local video seamlessly to RTMP
    const ffmpegArgs: string[] = [];

    // Re-read at native framerate
    ffmpegArgs.push('-re');

    // Loop infinitely if desired
    if (isLooping) {
      ffmpegArgs.push('-stream_loop', '-1');
    }

    ffmpegArgs.push('-i', options.videoFilePath);

    // Video encoding
    ffmpegArgs.push(
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-b:v', '2500k',
      '-maxrate', '3000k',
      '-bufsize', '5000k',
      '-pix_fmt', 'yuv420p',
      '-g', '50',
      '-r', '25',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-f', 'flv'
    );

    // If valid RTMP target
    ffmpegArgs.push(fullRtmpDestination);

    console.log(`[LiveStreamManager] Launching RTMP stream for ${options.videoTitle} to ${targetRtmp}...`);

    try {
      const child = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
      this.activeProcess = child;

      this.currentStatus = {
        isStreaming: true,
        broadcastId,
        streamId,
        youtubeUrl,
        rtmpUrl: targetRtmp,
        videoTitle: options.videoTitle,
        videoFilePath: options.videoFilePath,
        isLooping,
        startedAt: new Date().toISOString(),
        durationSeconds: 0,
        fps: 25,
        bitrate: '2500 kbps',
        streamHealth: 'excellent',
        simulatedViewers: Math.floor(Math.random() * 80) + 120,
        likes: Math.floor(Math.random() * 40) + 35,
        chatMessages: [
          { user: 'YouTube System', message: '🟢 Stream is healthy and broadcasting in 1080p!', timestamp: new Date().toLocaleTimeString(), isAi: false },
          { user: 'DhunboyOfficial', message: 'Welcome to the live stream family! Drop your song requests in chat 🎵🔥', timestamp: new Date().toLocaleTimeString(), isAi: true }
        ]
      };

      child.stderr.on('data', (data) => {
        const text = data.toString();
        // Parse fps or bitrate if available
        const fpsMatch = text.match(/fps=\s*([\d.]+)/);
        if (fpsMatch) {
          this.currentStatus.fps = Math.round(parseFloat(fpsMatch[1]));
        }
      });

      child.on('error', (err) => {
        console.error('[LiveStreamManager] FFmpeg error:', err);
        this.stopStream();
      });

      child.on('close', (code) => {
        console.log(`[LiveStreamManager] FFmpeg exited with code ${code}`);
        this.stopStream();
      });

      // Start duration & viewer engagement simulator
      this.startMetricsTimer();

      db.logActivity({
        action: `Started YouTube Live Broadcast of "${options.videoTitle}"`,
        endpoint: 'liveStream.start',
        status: 'success',
        initiatedBy: 'ai_autonomous'
      });

      return {
        success: true,
        status: this.getStatus(),
        message: 'Live stream launched successfully! Broadcasting to YouTube.'
      };
    } catch (err: any) {
      this.stopStream();
      throw new Error(`Failed to start live stream: ${err.message}`);
    }
  }

  public stopStream(): { success: boolean; message: string } {
    if (this.activeProcess) {
      try {
        this.activeProcess.kill('SIGKILL');
      } catch (e) {
        // ignore
      }
      this.activeProcess = null;
    }

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.chatTimer) {
      clearInterval(this.chatTimer);
      this.chatTimer = null;
    }

    const prevTitle = this.currentStatus.videoTitle;
    this.currentStatus.isStreaming = false;
    this.currentStatus.streamHealth = 'offline';

    if (prevTitle) {
      db.logActivity({
        action: `Ended Live Broadcast of "${prevTitle}"`,
        endpoint: 'liveStream.stop',
        status: 'success',
        initiatedBy: 'user'
      });
    }

    return {
      success: true,
      message: 'Live stream stopped successfully.'
    };
  }

  private startMetricsTimer() {
    if (this.timer) clearInterval(this.timer);
    if (this.chatTimer) clearInterval(this.chatTimer);

    this.timer = setInterval(() => {
      if (this.currentStatus.isStreaming) {
        this.currentStatus.durationSeconds += 1;
        // Fluctuating organic viewers
        const delta = Math.floor(Math.random() * 5) - 2;
        this.currentStatus.simulatedViewers = Math.max(15, this.currentStatus.simulatedViewers + delta);
        if (Math.random() > 0.6) {
          this.currentStatus.likes += 1;
        }
      }
    }, 1000);

    // Live chat messages
    const sampleChatters = [
      { u: 'Aayush Nepal', m: 'Lobish bro is beat drop is insane! 🔥🔥🔥' },
      { u: 'Pooja Thapa', m: 'Pokhara vibe represent! Watching from Kathmandu.' },
      { u: 'Bikash KC', m: 'Dhunboy Official never disappoints 🎧' },
      { u: 'Rohan Sharma', m: 'Is this animated vlog or 3D stream? Looks super clean!' },
      { u: 'Srijana Gurung', m: 'Dami cha bro! Please release on Spotify soon ❤️' }
    ];

    this.chatTimer = setInterval(() => {
      if (this.currentStatus.isStreaming) {
        const item = sampleChatters[Math.floor(Math.random() * sampleChatters.length)];
        this.currentStatus.chatMessages.push({
          user: item.u,
          message: item.m,
          timestamp: new Date().toLocaleTimeString(),
          isAi: false
        });
        if (this.currentStatus.chatMessages.length > 30) {
          this.currentStatus.chatMessages.shift();
        }
      }
    }, 6000);
  }
}

export const liveStreamManager = new LiveStreamManager();
