import {
  AppSettings,
  YouTubeChannel,
  VideoRecord,
  ShortRecord,
  PlaylistRecord,
  LiveBroadcastRecord,
  BackgroundJob,
  ContentPlanItem,
  SEORecord,
  AnalyticsSnapshot,
  AIChannelHealth,
  ActivityLog,
  QuotaTracker,
  DescriptionTemplate,
  AppNotification,
  AutomationPermissions,
  AutomationMode
} from './types';

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  getAuthStatus: () => req<{
    connected: boolean;
    isExpired: boolean;
    channel: YouTubeChannel | null;
    credentialsConfigured: boolean;
    clientIdConfigured: boolean;
    redirectUri: string;
    hasGeminiKey: boolean;
    hasYouTubeApiKey?: boolean;
    tokenExpiryDate: number | null;
    scopes: string[];
    diagnostics?: {
      googleClientId: string;
      googleClientSecret: string;
      geminiApiKey: string;
      youtubeApiKey: string;
      effectiveRedirectUri: string;
      appUrl: string;
    };
  }>('/api/auth/youtube/status'),

  getOAuthUrl: () => req<{ url: string; redirectUri: string }>('/api/auth/youtube?format=json'),
  saveCredentials: (clientId: string, clientSecret: string) =>
    req<{ success: boolean; message: string }>('/api/auth/credentials', {
      method: 'POST',
      body: JSON.stringify({ clientId, clientSecret })
    }),
  saveAllKeys: (data: { clientId?: string; clientSecret?: string; geminiApiKey?: string; youtubeApiKey?: string }) =>
    req<{ success: boolean; message: string; hasGeminiKey: boolean; credentialsConfigured: boolean }>('/api/auth/keys', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  testConnections: () =>
    req<{
      success: boolean;
      gemini: { status: 'online' | 'offline'; model: string | null; message: string };
      oauth: { status: string; clientIdLoaded: boolean; clientSecretLoaded: boolean; channelConnected: boolean; tokenValid: boolean };
    }>('/api/settings/test-connections', { method: 'POST' }),
  disconnect: () => req<{ success: boolean }>('/api/auth/youtube/disconnect', { method: 'POST' }),

  // Channel
  getChannelInfo: () => req<{ channel: YouTubeChannel | null }>('/api/channel/info'),
  syncChannel: () => req<{ success: boolean; channel: YouTubeChannel; health: AIChannelHealth; videoCount: number }>('/api/channel/sync', { method: 'POST' }),
  getVideos: () => req<{ localVideos: VideoRecord[]; youtubeVideos: any[] }>('/api/channel/videos'),
  getPlaylists: () => req<{ localPlaylists: PlaylistRecord[]; remotePlaylists: any[] }>('/api/channel/playlists'),
  createPlaylist: (title: string, description: string, privacy: string) =>
    req<{ success: boolean; playlist: PlaylistRecord }>('/api/channel/playlists', {
      method: 'POST',
      body: JSON.stringify({ title, description, privacy })
    }),
  getAnalytics: (period: '7d' | '28d' | '90d' = '28d') =>
    req<{ analytics: AnalyticsSnapshot; health: AIChannelHealth | null }>(`/api/channel/analytics?period=${period}`),
  getChannelHealth: () => req<{ health: AIChannelHealth }>('/api/channel/health'),

  // Upload
  checkDuplicate: (title: string, fileHash?: string) =>
    req<{
      isDuplicate: boolean;
      hashMatch: { id: string; title: string } | null;
      similarityMatch: { id: string; title: string; similarity: number } | null;
      warning: string | null;
    }>('/api/upload/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ title, fileHash })
    }),

  uploadVideoFile: async (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    const res = await fetch('/api/upload/file', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload video file');
    }
    return res.json() as Promise<{
      success: boolean;
      filename: string;
      filePath: string;
      fileHash: string;
      sizeBytes: number;
      metadata: any;
    }>;
  },

  publishVideo: (data: any) =>
    req<{ success: boolean; video: VideoRecord; jobId?: string; message: string }>('/api/upload/publish', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Shorts
  getShorts: () => req<{ shorts: ShortRecord[] }>('/api/shorts'),
  generateShortsBreakdown: (data: {
    videoTitle: string;
    transcriptOrDescription?: string;
    genre?: string;
    durationSeconds?: number;
  }) => req<{ success: boolean; breakdown: any }>('/api/shorts/generate-breakdown', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  clipShort: (data: any) =>
    req<{ success: boolean; short: ShortRecord; jobId: string; message: string }>('/api/shorts/clip', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  uploadShort: (shortId: string) =>
    req<{ success: boolean; jobId: string; message: string }>('/api/shorts/upload', {
      method: 'POST',
      body: JSON.stringify({ shortId })
    }),

  // Live
  getLiveBroadcasts: () => req<{ broadcasts: LiveBroadcastRecord[] }>('/api/live'),
  createLiveBroadcast: (data: {
    title: string;
    description: string;
    scheduledStartTime: string;
    privacyStatus?: string;
  }) => req<{ success: boolean; broadcast: LiveBroadcastRecord; message: string }>('/api/live/broadcast', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // SEO
  getSEORecords: () => req<{ records: SEORecord[] }>('/api/seo/records'),
  generateTitles: (data: { songTitle: string; artist?: string; genre?: string; isRemix?: boolean }) =>
    req<{ success: boolean; titles: any }>('/api/seo/generate-titles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  analyzeSEO: (data: {
    songTitle: string;
    artist?: string;
    genre?: string;
    language?: string;
    targetAudience?: string;
    isAiAssisted?: boolean;
  }) => req<{ success: boolean; seoRecord: SEORecord }>('/api/seo/analyze', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  analyzeContent: (data: any) =>
    req<{ success: boolean; analysis: any }>('/api/seo/analyze-content', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Planner
  getPlans: () => req<{ plans: ContentPlanItem[] }>('/api/planner/plans'),
  generatePlans: () => req<{ success: boolean; plans: ContentPlanItem[] }>('/api/planner/generate', { method: 'POST' }),
  createPlan: (data: any) => req<{ success: boolean; plan: ContentPlanItem }>('/api/planner/plans', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updatePlan: (id: string, data: any) => req<{ success: boolean; plan: ContentPlanItem }>(`/api/planner/plans/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deletePlan: (id: string) => req<{ success: boolean }>(`/api/planner/plans/${id}`, { method: 'DELETE' }),

  // Automation
  getAutomationSettings: () => req<{ mode: AutomationMode; permissions: AutomationPermissions }>('/api/automation/settings'),
  setAutomationMode: (mode: AutomationMode) =>
    req<{ success: boolean; mode: AutomationMode }>('/api/automation/mode', {
      method: 'POST',
      body: JSON.stringify({ mode })
    }),
  setPermissions: (permissions: Partial<AutomationPermissions>) =>
    req<{ success: boolean; permissions: AutomationPermissions }>('/api/automation/permissions', {
      method: 'POST',
      body: JSON.stringify({ permissions })
    }),
  triggerCycle: () =>
    req<{
      success: boolean;
      cycleResult: {
        mode: string;
        decisions: Array<{ action: string; allowed: boolean; reason: string; executed: boolean; result?: string }>;
      };
    }>('/api/automation/trigger-cycle', { method: 'POST' }),
  getJobs: () => req<{ jobs: BackgroundJob[] }>('/api/automation/jobs'),

  // Activity & Notifications
  getActivityLogs: (limit = 100) => req<{ logs: ActivityLog[] }>(`/api/activity/logs?limit=${limit}`),
  getNotifications: () => req<{ notifications: AppNotification[] }>('/api/activity/notifications'),
  markNotificationRead: (id: string) => req<{ success: boolean }>(`/api/activity/notifications/${id}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => req<{ success: boolean }>('/api/activity/notifications/read-all', { method: 'POST' }),

  // Quota
  getQuota: () => req<{ quota: QuotaTracker }>('/api/quota'),

  // Assistant
  sendAssistantMessage: (message: string, history: Array<{ role: 'user' | 'model'; text: string }> = []) =>
    req<{
      reply: string;
      speechText: string;
      detectedLanguage?: string;
      actionTaken?: { type: string; description: string; data?: any };
      suggestedPrompts: string[];
    }>('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    }),
  getAssistantStatus: () =>
    req<{
      assistantName: string;
      title: string;
      channelConnected: boolean;
      channelName: string;
      channelId: string | null;
      automationMode: string;
      isAutonomous: boolean;
      backgroundWorkerActive: boolean;
      pendingJobsCount: number;
      activeTasks: Array<{ id: string; title: string; status: string }>;
      timestamp: string;
    }>('/api/assistant/status'),
  triggerAssistantCycle: () =>
    req<{ success: boolean; message: string; syncResult?: any }>('/api/assistant/trigger-cycle', { method: 'POST' }),

  // Settings
  getSettings: () =>
    req<{
      settings: AppSettings;
      credentialsConfigured: boolean;
      clientId: string;
      hasGeminiKey: boolean;
      hasYouTubeApiKey: boolean;
      redirectUri: string;
      appUrl: string;
      diagnostics?: {
        googleClientId: string;
        googleClientSecret: string;
        geminiApiKey: string;
        youtubeApiKey: string;
        redirectUri: string;
        appUrl: string;
      };
    }>('/api/settings'),
  updateSettings: (data: Partial<AppSettings>) => req<{ success: boolean; settings: AppSettings }>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  getTemplates: () => req<{ templates: DescriptionTemplate[] }>('/api/settings/templates'),
  createTemplate: (data: any) => req<{ success: boolean; template: DescriptionTemplate }>('/api/settings/templates', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateTemplate: (id: string, data: any) => req<{ success: boolean; template: DescriptionTemplate }>(`/api/settings/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteTemplate: (id: string) => req<{ success: boolean }>(`/api/settings/templates/${id}`, { method: 'DELETE' }),

  // Autonomous Video Studio & Monetization Accelerator
  generateAutonomousVideo: (options: any) =>
    req<{ success: boolean; video: any }>('/api/generate/video', {
      method: 'POST',
      body: JSON.stringify(options)
    }),
  getGeneratedHistory: () =>
    req<{ videos: any[]; shorts: any[] }>('/api/generate/history'),
  publishGeneratedVideo: (id: string, privacyStatus?: string) =>
    req<{ success: boolean; youtubeVideoId: string; youtubeUrl: string }>(`/api/generate/publish/${id}`, {
      method: 'POST',
      body: JSON.stringify({ privacyStatus })
    }),
  getMonetizationStatus: () =>
    req<{
      watchHours: {
        current: number;
        target: number;
        remaining: number;
        percentage: number;
        estimatedDaysToGoal: number;
      };
      subscribers: {
        current: number;
        target: number;
        remaining: number;
        percentage: number;
      };
      monetizationReadiness: {
        policyCompliant: boolean;
        aiDisclosureActive: boolean;
        copyrightStrikes: number;
        communityGuidelinesStrikes: number;
        highCpmStrategyActive: boolean;
      };
      tactics: Array<{ id: string; name: string; description: string; status: string }>;
    }>('/api/generate/monetization/status'),
  getCommunityPosts: () =>
    req<{ posts: any[] }>('/api/generate/community'),

  // Live Streaming & Pre-recorded Broadcasting
  getLiveStreamStatus: () =>
    req<{ status: any }>('/api/live/stream/status'),
  getStreamableVideos: () =>
    req<{ videos: Array<{ id: string; title: string; filePath: string; format: string; url: string; thumbnailUrl: string }> }>('/api/live/stream/videos'),
  startLiveStream: (options: {
    videoFilePath?: string;
    videoTitle?: string;
    rtmpUrl?: string;
    streamKey?: string;
    loop?: boolean;
    createYouTubeBroadcast?: boolean;
    broadcastTitle?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
  }) =>
    req<{ success: boolean; status: any; message: string }>('/api/live/stream/start', {
      method: 'POST',
      body: JSON.stringify(options)
    }),
  stopLiveStream: () =>
    req<{ success: boolean; message: string }>('/api/live/stream/stop', { method: 'POST' }),

  // Daily 4-in-1 Routine & Master Playlist Engine
  getDailyStatus: () =>
    req<{ status: any }>('/api/generate/daily/status'),
  runDailyRoutine: () =>
    req<{ success: boolean; results: any; message: string }>('/api/generate/daily/run', { method: 'POST' }),
  toggleDailyRoutine: (active: boolean) =>
    req<{ success: boolean; status: any }>('/api/generate/daily/toggle', {
      method: 'POST',
      body: JSON.stringify({ active })
    }),
  syncMasterPlaylist: () =>
    req<{
      success: boolean;
      playlistId: string;
      playlistTitle: string;
      playlistUrl: string;
      addedCount: number;
      totalVideos: number;
      message: string;
    }>('/api/generate/playlist/sync-all', { method: 'POST' }),
  getDeepDiveAnalytics: () =>
    req<{
      summary: any;
      reach: any;
      engagement: any;
      audience: any;
      promotion: any;
    }>('/api/generate/analytics/deep-dive')
};
