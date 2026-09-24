import { db } from '../db/store.js';
import { BackgroundJob, JobType } from '../types.js';
import { YouTubeService } from './youtube.js';
import { VideoProcessor } from './videoProcessor.js';
import { AutonomousVideoGenerator } from './videoGenerator.js';
import {
  generateSEOMetadata,
  generateShortsBreakdown,
  analyzeChannelHealthAndAnalytics,
  generateContentPlanIdeas
} from './aiManager.js';

class JobQueueService {
  private isProcessing = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    this.startWorker();
  }

  public enqueueJob(type: JobType, title: string, payload: any): BackgroundJob {
    const job: BackgroundJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      status: 'PENDING',
      payload,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    db.addJob(job);
    // Process tick asynchronously
    setTimeout(() => this.processNextJob(), 100);
    return job;
  }

  public startWorker() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.processNextJob();
      this.checkScheduledTasks();
    }, 10000); // Check every 10 seconds
  }

  public stopWorker() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async processNextJob() {
    if (this.isProcessing) return;

    const pendingJobs = db.getJobs().filter(j => j.status === 'PENDING');
    if (pendingJobs.length === 0) return;

    const job = pendingJobs[0];
    this.isProcessing = true;

    db.updateJob(job.id, {
      status: 'RUNNING',
      startedAt: new Date().toISOString()
    });

    try {
      const result = await this.executeJobTask(job);
      db.updateJob(job.id, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
        result
      });

      db.addNotification({
        title: `Task Completed: ${job.title}`,
        message: `Background job ${job.type} finished successfully.`,
        type: 'success'
      });

      db.logActivity({
        action: `Completed job: ${job.type}`,
        title: job.title,
        endpoint: `/jobs/${job.id}`,
        status: 'success',
        initiatedBy: 'ai_autonomous'
      });
    } catch (err: any) {
      console.error(`Error executing job ${job.id} (${job.type}):`, err);
      const newRetry = job.retryCount + 1;
      const willRetry = newRetry < job.maxRetries;

      db.updateJob(job.id, {
        status: willRetry ? 'PENDING' : 'FAILED',
        retryCount: newRetry,
        error: err.message || 'Unknown execution error'
      });

      if (!willRetry) {
        db.addNotification({
          title: `Task Failed: ${job.title}`,
          message: err.message,
          type: 'error'
        });

        db.logActivity({
          action: `Failed job: ${job.type}`,
          title: job.title,
          endpoint: `/jobs/${job.id}`,
          status: 'failure',
          errorMessage: err.message,
          initiatedBy: 'ai_autonomous'
        });
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeJobTask(job: BackgroundJob): Promise<any> {
    const { type, payload } = job;

    switch (type) {
      case 'UPLOAD_VIDEO': {
        const uploadResult = await YouTubeService.uploadVideo({
          title: payload.title,
          description: payload.description,
          tags: payload.tags || [],
          categoryId: payload.categoryId,
          privacyStatus: payload.privacyStatus || 'unlisted',
          filePath: payload.filePath,
          isShort: payload.isShort
        });

        if (payload.videoId) {
          db.updateVideo(payload.videoId, {
            status: 'published',
            youtubeVideoId: uploadResult.id,
            publishedAt: new Date().toISOString()
          });
        }

        if (payload.playlistId) {
          try {
            await YouTubeService.addVideoToPlaylist(payload.playlistId, uploadResult.id);
          } catch (plErr) {
            console.warn('Failed to attach uploaded video to playlist:', plErr);
          }
        }
        return uploadResult;
      }

      case 'UPLOAD_SHORT': {
        const shortResult = await YouTubeService.uploadVideo({
          title: `${payload.title} #Shorts`,
          description: payload.description || '',
          tags: [...(payload.tags || []), 'Shorts', 'YouTubeShorts'],
          privacyStatus: payload.privacyStatus || 'unlisted',
          filePath: payload.filePath,
          isShort: true
        });

        if (payload.shortId) {
          db.updateShort(payload.shortId, {
            status: 'uploaded',
            youtubeVideoId: shortResult.id
          });
        }
        return shortResult;
      }

      case 'PROCESS_VIDEO_CLIP': {
        await VideoProcessor.convertToShortFormat(
          payload.inputPath,
          payload.outputPath,
          payload.startSec || 0,
          payload.durationSec || 45
        );

        if (payload.shortId) {
          db.updateShort(payload.shortId, {
            videoPath: payload.outputPath,
            status: 'ready'
          });
        }
        return { outputPath: payload.outputPath };
      }

      case 'GENERATE_SEO': {
        return await generateSEOMetadata(payload);
      }

      case 'GENERATE_CONTENT_PLAN': {
        return await generateContentPlanIdeas();
      }

      case 'SYNC_ANALYTICS': {
        const channel = await YouTubeService.syncChannelProfile().catch(() => db.getChannel());
        const videos = await YouTubeService.fetchChannelVideos().catch(() => db.getVideos());
        const analytics = db.getAnalytics('28d');
        const health = await analyzeChannelHealthAndAnalytics(channel, videos, analytics);
        return { channel, health };
      }

      case 'CREATE_LIVE': {
        const liveResult = await YouTubeService.createLiveBroadcast({
          title: payload.title,
          description: payload.description,
          scheduledStartTime: payload.scheduledStartTime,
          privacyStatus: payload.privacyStatus
        });

        if (payload.broadcastId) {
          db.updateLiveBroadcast(payload.broadcastId, {
            youtubeBroadcastId: liveResult.broadcastId,
            youtubeStreamId: liveResult.streamId,
            rtmpIngestionAddress: liveResult.rtmpUrl,
            streamName: liveResult.streamKey,
            status: 'ready'
          });
        }
        return liveResult;
      }

      case 'CREATE_PLAYLIST': {
        return await YouTubeService.createPlaylist(payload.title, payload.description, payload.privacy);
      }
      case 'AUTONOMOUS_CREATE_AND_UPLOAD_VIDEO': {
        return await AutonomousVideoGenerator.generateAutonomousVideo({
          ...payload,
          autoUpload: true
        });
      }

      default:
        return { message: `Completed custom job ${type}` };
    }
  }

  private lastAutonomousCycle: number = 0;

  private async checkScheduledTasks() {
    const settings = db.getSettings();
    const now = new Date();

    // Check scheduled videos
    const scheduledVideos = db.getVideos().filter(v =>
      v.status === 'queued' &&
      v.isScheduled &&
      v.scheduledTime &&
      new Date(v.scheduledTime) <= now
    );

    for (const v of scheduledVideos) {
      if (settings.permissions.uploadVideos && v.videoFilePath) {
        db.updateVideo(v.id, { status: 'uploading' });
        this.enqueueJob('UPLOAD_VIDEO', `Scheduled Upload: ${v.title}`, {
          videoId: v.id,
          title: v.title,
          description: v.description,
          tags: v.tags,
          categoryId: v.categoryId,
          privacyStatus: v.privacyStatus,
          filePath: v.videoFilePath,
          isShort: v.isShort
        });
      }
    }

    // 24/7 Autonomous Background Execution (Even when browser is closed)
    if (settings.automationMode === 'autonomous') {
      const nowMs = Date.now();
      // Run autonomous routine every 10 minutes
      if (nowMs - this.lastAutonomousCycle > 10 * 60 * 1000) {
        this.lastAutonomousCycle = nowMs;
        this.executeAutonomousCycle();
      }
    }
  }

  private async executeAutonomousCycle() {
    try {
      const token = db.getStoredToken();
      if (token) {
        // 1. Autonomous Channel Profile & Analytics Sync
        await YouTubeService.syncChannelProfile().catch(e => {
          console.warn('[Autonomous Worker] Background sync warning:', e.message);
        });
      }

      // 2. Autonomous Content Ideation if content plan is low
      const existingIdeas = db.getContentPlans();
      if (existingIdeas.length < 3) {
        this.enqueueJob('GENERATE_CONTENT_PLAN', 'Autonomous Content Ideation for Dhunboy Official', {});
      }

      db.logActivity({
        action: 'Autonomous 24/7 Background Cycle',
        title: 'Background AI Manager Synced Channel & Queue',
        endpoint: '/worker/autonomous',
        status: 'success',
        initiatedBy: 'ai_autonomous'
      });
    } catch (err: any) {
      console.warn('[Autonomous Worker] Background cycle exception:', err.message);
    }
  }
}

export const jobQueue = new JobQueueService();
