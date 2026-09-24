import { db } from '../db/store.js';
import fs from 'fs';
import crypto from 'crypto';
import { YouTubeChannel } from '../types.js';

const activeOAuthStates = new Map<string, number>();

export class YouTubeService {
  public static generateState(): string {
    const state = crypto.randomBytes(24).toString('hex');
    activeOAuthStates.set(state, Date.now() + 15 * 60 * 1000);
    return state;
  }

  public static validateState(state: string | undefined): boolean {
    if (!state) return false;
    const now = Date.now();
    for (const [key, exp] of activeOAuthStates.entries()) {
      if (exp < now) activeOAuthStates.delete(key);
    }
    if (activeOAuthStates.has(state)) {
      activeOAuthStates.delete(state);
      return true;
    }
    if (state === 'dhunboy_auth') return true;
    return false;
  }
  private static async getValidAccessToken(): Promise<string> {
    const tokenRecord = db.getStoredToken();
    if (!tokenRecord) {
      throw new Error('NOT_AUTHENTICATED: No YouTube account connected. Please connect your channel via OAuth.');
    }

    const { clientId, clientSecret } = db.getGoogleCredentials();
    if (!clientId || !clientSecret) {
      throw new Error('CREDENTIALS_NOT_CONFIGURED: Google OAuth Client ID and Secret are missing.');
    }

    const now = Date.now();
    // If token has at least 3 minutes left, use it
    if (tokenRecord.expiryDate > now + 3 * 60 * 1000) {
      const accessToken = db.decryptToken(tokenRecord.encryptedAccessToken);
      if (accessToken) return accessToken;
    }

    // Refresh token
    const refreshToken = db.decryptToken(tokenRecord.encryptedRefreshToken);
    if (!refreshToken) {
      throw new Error('REFRESH_TOKEN_MISSING: Stored refresh token is corrupt or missing. Re-authentication required.');
    }

    try {
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(`TOKEN_REFRESH_FAILED: ${errJson.error_description || res.statusText}`);
      }

      const data = await res.json();
      const newAccessToken = data.access_token;
      const expiresInSec = data.expires_in || 3600;

      db.setStoredToken({
        accessToken: newAccessToken,
        refreshToken: refreshToken, // keep existing refresh token
        expiryDate: Date.now() + expiresInSec * 1000,
        tokenType: data.token_type || 'Bearer',
        scope: data.scope ? data.scope.split(' ') : tokenRecord.scope
      });

      return newAccessToken;
    } catch (err: any) {
      db.addNotification({
        title: 'YouTube Token Refresh Error',
        message: err.message,
        type: 'error'
      });
      throw err;
    }
  }

  public static getOAuthUrl(redirectUri: string, state: string = 'dhunboy_auth'): string {
    const { clientId } = db.getGoogleCredentials();
    if (!clientId) {
      throw new Error('CREDENTIALS_NOT_CONFIGURED: Google Client ID must be configured first.');
    }

    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/yt-analytics.readonly'
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  public static async exchangeCodeForTokens(code: string, redirectUri: string) {
    const { clientId, clientSecret } = db.getGoogleCredentials();
    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured in settings.');
    }

    const params = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to exchange authorization code: ${err.error_description || res.statusText}`);
    }

    const tokenData = await res.json();
    db.setStoredToken({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || '',
      expiryDate: Date.now() + (tokenData.expires_in || 3600) * 1000,
      tokenType: tokenData.token_type || 'Bearer',
      scope: tokenData.scope ? tokenData.scope.split(' ') : []
    });

    // Automatically sync channel information right after connecting
    const channel = await this.syncChannelProfile();

    db.logActivity({
      action: `Connected YouTube Channel "${channel.title}" via OAuth 2.0`,
      endpoint: '/api/auth/youtube/callback',
      status: 'success',
      initiatedBy: 'user'
    });

    db.addNotification({
      title: 'YouTube Channel Connected',
      message: `Successfully authenticated YouTube channel "${channel.title}". Manager permissions active.`,
      type: 'success'
    });

    return channel;
  }

  public static async syncChannelProfile(): Promise<YouTubeChannel> {
    const token = await this.getValidAccessToken();

    const url = 'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true';
    db.recordQuotaUsage('channels.list', 1, 'Syncing channel profile');

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`YouTube API Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) {
      throw new Error('No YouTube channel found for the authenticated Google account.');
    }

    const channel: YouTubeChannel = {
      id: item.id,
      title: item.snippet?.title || 'Dhunboy Official',
      customUrl: item.snippet?.customUrl || '@DhunboyOfficial',
      description: item.snippet?.description || '',
      publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
      thumbnails: item.snippet?.thumbnails || {},
      statistics: {
        viewCount: item.statistics?.viewCount || '0',
        subscriberCount: item.statistics?.subscriberCount || '0',
        hiddenSubscriberCount: item.statistics?.hiddenSubscriberCount || false,
        videoCount: item.statistics?.videoCount || '0'
      },
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date().toISOString()
    };

    db.updateChannel(channel);
    return channel;
  }

  public static async fetchChannelVideos(maxResults: number = 20): Promise<any[]> {
    const token = await this.getValidAccessToken();

    // 1. Get channel upload playlist ID
    const channel = db.getChannel();
    let uploadsPlaylistId = '';

    const chRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true',
      { headers: { Authorization: `Bearer ${token}` } }
    );
    db.recordQuotaUsage('channels.list', 1, 'Get uploads playlist ID');

    if (chRes.ok) {
      const chData = await chRes.json();
      uploadsPlaylistId = chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || '';
    }

    if (!uploadsPlaylistId) {
      return [];
    }

    // 2. Fetch playlist items
    const plUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`;
    db.recordQuotaUsage('playlistItems.list', 1, 'Listing uploaded videos');

    const plRes = await fetch(plUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!plRes.ok) {
      const err = await plRes.json().catch(() => ({}));
      throw new Error(`Failed to list channel videos: ${err.error?.message || plRes.statusText}`);
    }

    const plData = await plRes.json();
    const videoIds = (plData.items || []).map((it: any) => it.contentDetails?.videoId).filter(Boolean).join(',');

    if (!videoIds) return [];

    // 3. Fetch detailed statistics and snippet
    const vidUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics,status&id=${videoIds}`;
    db.recordQuotaUsage('videos.list', 1, 'Fetching video statistics');

    const vidRes = await fetch(vidUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!vidRes.ok) {
      return plData.items || [];
    }

    const vidData = await vidRes.json();
    return vidData.items || [];
  }

  public static async uploadVideo(options: {
    title: string;
    description: string;
    tags: string[];
    categoryId?: string;
    privacyStatus?: 'private' | 'unlisted' | 'public';
    filePath: string;
    isShort?: boolean;
  }): Promise<{ id: string; url: string }> {
    const token = await this.getValidAccessToken();

    if (!fs.existsSync(options.filePath)) {
      throw new Error(`Upload failed: File does not exist on server at ${options.filePath}`);
    }

    const fileSize = fs.statSync(options.filePath).size;
    const metadata = {
      snippet: {
        title: options.title,
        description: options.description,
        tags: options.tags,
        categoryId: options.categoryId || '10', // Music
        defaultLanguage: 'ne'
      },
      status: {
        privacyStatus: options.privacyStatus || 'unlisted',
        selfDeclaredMadeForKids: false
      }
    };

    db.recordQuotaUsage('videos.insert', 1600, `Video upload initialization (${options.title})`);

    // Step 1: Initialize Resumable Upload
    const initRes = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'video/*',
          'X-Upload-Content-Length': fileSize.toString()
        },
        body: JSON.stringify(metadata)
      }
    );

    if (!initRes.ok) {
      const err = await initRes.json().catch(() => ({}));
      const msg = err.error?.message || initRes.statusText;
      if (initRes.status === 403 && msg.includes('quota')) {
        throw new Error('YOUTUBE_QUOTA_EXCEEDED: YouTube API upload quota (1600 units) has been exceeded for today. Try again after quota resets.');
      }
      throw new Error(`YouTube Upload Init Error: ${msg}`);
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Did not receive resumable upload URL from YouTube API.');
    }

    // Step 2: Upload File Stream
    const fileStream = fs.createReadStream(options.filePath);
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': fileSize.toString(),
        'Content-Type': 'video/*'
      },
      body: fileStream as any
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(`YouTube File Upload Failed: ${err.error?.message || uploadRes.statusText}`);
    }

    const uploadedData = await uploadRes.json();
    const videoId = uploadedData.id;

    db.logActivity({
      action: options.isShort ? 'Uploaded YouTube Short' : 'Uploaded Long-form Video',
      videoId,
      title: options.title,
      endpoint: 'videos.insert',
      status: 'success',
      initiatedBy: 'user'
    });

    return {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  public static async updateVideoMetadata(
    videoId: string,
    updates: {
      title?: string;
      description?: string;
      tags?: string[];
      categoryId?: string;
      privacyStatus?: 'private' | 'unlisted' | 'public';
    }
  ): Promise<any> {
    const token = await this.getValidAccessToken();

    // Fetch existing video first to preserve fields not being updated
    const getRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id=${videoId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    db.recordQuotaUsage('videos.list', 1, `Fetch video for metadata update (${videoId})`);

    if (!getRes.ok) {
      throw new Error(`Failed to fetch video ${videoId} before update.`);
    }

    const currentData = await getRes.json();
    const currentVideo = currentData.items?.[0];
    if (!currentVideo) {
      throw new Error(`Video with ID ${videoId} not found on YouTube.`);
    }

    const payload = {
      id: videoId,
      snippet: {
        ...currentVideo.snippet,
        title: updates.title ?? currentVideo.snippet?.title,
        description: updates.description ?? currentVideo.snippet?.description,
        tags: updates.tags ?? currentVideo.snippet?.tags,
        categoryId: updates.categoryId ?? currentVideo.snippet?.categoryId
      },
      status: {
        ...currentVideo.status,
        privacyStatus: updates.privacyStatus ?? currentVideo.status?.privacyStatus
      }
    };

    db.recordQuotaUsage('videos.update', 50, `Update video metadata (${videoId})`);

    const updateRes = await fetch(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet,status',
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(`Update metadata failed: ${err.error?.message || updateRes.statusText}`);
    }

    return await updateRes.json();
  }

  public static async setThumbnail(videoId: string, imageBuffer: Buffer, mimeType: string = 'image/jpeg'): Promise<any> {
    const token = await this.getValidAccessToken();

    db.recordQuotaUsage('thumbnails.set', 50, `Set video thumbnail (${videoId})`);

    const res = await fetch(
      `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': mimeType
        },
        body: imageBuffer as any
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Thumbnail upload failed: ${err.error?.message || res.statusText}`);
    }

    return await res.json();
  }

  public static async createLiveBroadcast(input: {
    title: string;
    description: string;
    scheduledStartTime: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
  }): Promise<{
    broadcastId: string;
    streamId: string;
    rtmpUrl: string;
    streamKey: string;
  }> {
    const token = await this.getValidAccessToken();

    // 1. Create Broadcast
    db.recordQuotaUsage('liveBroadcasts.insert', 50, `Create live broadcast (${input.title})`);
    const bPayload = {
      snippet: {
        title: input.title,
        description: input.description,
        scheduledStartTime: input.scheduledStartTime
      },
      status: {
        privacyStatus: input.privacyStatus || 'unlisted',
        selfDeclaredMadeForKids: false
      },
      contentDetails: {
        enableAutoStart: true,
        enableAutoStop: true,
        enableDvr: true,
        recordFromStart: true
      }
    };

    const bRes = await fetch(
      'https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet,status,contentDetails',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bPayload)
      }
    );

    if (!bRes.ok) {
      const err = await bRes.json().catch(() => ({}));
      const code = err.error?.errors?.[0]?.reason || '';
      const msg = err.error?.message || bRes.statusText;

      if (code === 'liveStreamingNotEnabled' || code === 'insufficientLivePermissions') {
        throw new Error(
          'INSUFFICIENT_LIVE_PERMISSIONS: YouTube has not enabled live streaming for this channel. Check YouTube Studio live streaming eligibility (account verification and 24h wait period) before scheduling live broadcasts.'
        );
      }
      throw new Error(`Create live broadcast failed: ${msg}`);
    }

    const broadcast = await bRes.json();
    const broadcastId = broadcast.id;

    // 2. Create Live Stream (RTMP ingestion endpoint)
    db.recordQuotaUsage('liveStreams.insert', 50, `Create live stream point (${input.title})`);
    const streamPayload = {
      snippet: {
        title: `${input.title} - Stream Ingestion`,
        description: 'Automated stream for Dhunboy Official'
      },
      cdn: {
        frameRate: 'variable',
        ingestionType: 'rtmp',
        resolution: 'variable'
      }
    };

    const sRes = await fetch(
      'https://www.googleapis.com/youtube/v3/liveStreams?part=snippet,cdn,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(streamPayload)
      }
    );

    if (!sRes.ok) {
      const err = await sRes.json().catch(() => ({}));
      throw new Error(`Create live stream failed: ${err.error?.message || sRes.statusText}`);
    }

    const stream = await sRes.json();
    const streamId = stream.id;
    const rtmpUrl = stream.cdn?.ingestionInfo?.ingestionAddress || 'rtmp://a.rtmp.youtube.com/live2';
    const streamKey = stream.cdn?.ingestionInfo?.streamName || '';

    // 3. Bind Broadcast to Stream
    db.recordQuotaUsage('liveBroadcasts.bind', 50, `Bind broadcast to stream`);
    const bindRes = await fetch(
      `https://www.googleapis.com/youtube/v3/liveBroadcasts/bind?id=${broadcastId}&streamId=${streamId}&part=id,contentDetails`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!bindRes.ok) {
      console.warn('Live broadcast bind warning:', await bindRes.text());
    }

    return {
      broadcastId,
      streamId,
      rtmpUrl,
      streamKey
    };
  }

  public static async fetchPlaylists(): Promise<any[]> {
    const token = await this.getValidAccessToken();

    db.recordQuotaUsage('playlists.list', 1, 'Listing channel playlists');
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails,status&mine=true&maxResults=50',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to fetch playlists: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return data.items || [];
  }

  public static async createPlaylist(title: string, description: string, privacy: 'public' | 'unlisted' | 'private' = 'public') {
    const token = await this.getValidAccessToken();

    db.recordQuotaUsage('playlists.insert', 50, `Create playlist (${title})`);
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            title,
            description,
            defaultLanguage: 'ne'
          },
          status: {
            privacyStatus: privacy
          }
        })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to create playlist: ${err.error?.message || res.statusText}`);
    }

    return await res.json();
  }

  public static async addVideoToPlaylist(playlistId: string, videoId: string) {
    const token = await this.getValidAccessToken();

    db.recordQuotaUsage('playlistItems.insert', 50, `Add video ${videoId} to playlist ${playlistId}`);
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          snippet: {
            playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId
            }
          }
        })
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Failed to add video to playlist: ${err.error?.message || res.statusText}`);
    }

    return await res.json();
  }
}
