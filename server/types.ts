export type AutomationMode = 'manual' | 'assisted' | 'autonomous';

export interface AutomationPermissions {
  generateTitles: boolean;
  generateDescriptions: boolean;
  generateKeywords: boolean;
  generateTags: boolean;
  generateHashtags: boolean;
  createPlaylists: boolean;
  uploadVideos: boolean;
  uploadShorts: boolean;
  scheduleVideos: boolean;
  publishVideos: boolean;
  updateMetadata: boolean;
  createLiveBroadcasts: boolean;
  streamWorkflow: boolean;
  analyzeAnalytics: boolean;
  generateContentIdeas: boolean;
  autoOptimizeMetadata: boolean;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  customUrl?: string;
  description: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  connectedAt: string;
  lastSyncAt: string;
}

export interface StoredOAuthToken {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
  expiryDate: number;
  tokenType: string;
  scope: string[];
}

export interface VideoRecord {
  id: string;
  youtubeVideoId?: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: 'private' | 'unlisted' | 'public';
  isScheduled?: boolean;
  scheduledTime?: string;
  isShort: boolean;
  duration?: string;
  thumbnailUrl?: string;
  videoFilePath?: string;
  fileHash?: string;
  artist?: string;
  songType?: string;
  isAiAssisted?: boolean;
  aiDisclosureText?: string;
  publishedAt?: string;
  status: 'draft' | 'queued' | 'uploading' | 'published' | 'failed';
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  views?: number;
  likes?: number;
  comments?: number;
  aiDisclosureIncluded?: boolean;
  lastOptimizedAt?: string;
  seoScore?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ShortRecord {
  id: string;
  youtubeVideoId?: string;
  title: string;
  description?: string;
  tags?: string[];
  hook?: string;
  first3SecondsAdvice?: string;
  captionText?: string;
  sourceVideoId?: string;
  segmentStart?: number;
  segmentEnd?: number;
  videoPath?: string;
  thumbnailUrl?: string;
  duration?: number;
  aspectRatio?: string;
  scheduledTime?: string;
  privacyStatus?: 'private' | 'unlisted' | 'public';
  status: 'draft' | 'processing' | 'ready' | 'uploaded' | 'failed';
  createdAt: string;
}

export interface PlaylistRecord {
  id: string;
  youtubePlaylistId?: string;
  title: string;
  description: string;
  privacyStatus: 'public' | 'unlisted' | 'private';
  itemCount: number;
  defaultLanguage?: string;
  createdAt: string;
}

export interface LiveBroadcastRecord {
  id: string;
  youtubeBroadcastId?: string;
  youtubeStreamId?: string;
  title: string;
  description: string;
  scheduledStartTime: string;
  privacyStatus: 'public' | 'unlisted' | 'private';
  status: 'created' | 'ready' | 'live' | 'completed' | 'revoked';
  rtmpIngestionAddress?: string;
  streamName?: string;
  streamStatus?: string;
  isStreamingProcessActive?: boolean;
  createdAt: string;
}

export type JobType =
  | 'UPLOAD_VIDEO'
  | 'UPLOAD_SHORT'
  | 'GENERATE_SEO'
  | 'GENERATE_DESCRIPTION'
  | 'GENERATE_TAGS'
  | 'CREATE_PLAYLIST'
  | 'SCHEDULE_VIDEO'
  | 'CREATE_LIVE'
  | 'START_STREAM'
  | 'STOP_STREAM'
  | 'SYNC_ANALYTICS'
  | 'ANALYZE_CHANNEL'
  | 'OPTIMIZE_METADATA'
  | 'GENERATE_CONTENT_PLAN'
  | 'PROCESS_VIDEO_CLIP'
  | 'AUTONOMOUS_CREATE_AND_UPLOAD_VIDEO';

export interface BackgroundJob {
  id: string;
  type: JobType;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  payload: any;
  result?: any;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ContentPlanItem {
  id: string;
  topic: string;
  proposedTitle: string;
  format: 'Long-form' | 'Short' | 'DJ Remix' | 'Lok Dohori' | 'Live Session';
  hook: string;
  keywords: string[];
  hashtags: string[];
  suggestedUploadDate: string;
  reason: string;
  status: 'idea' | 'planned' | 'in_progress' | 'published';
  createdAt: string;
}

export interface SEORecord {
  id: string;
  videoId?: string;
  songTitle: string;
  artist: string;
  genre: string;
  language: string;
  targetAudience: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  longTailKeywords: string[];
  youtubeTags: string[];
  hashtags: string[];
  seoTitles: {
    searchFocused: string;
    curiosityFocused: string;
    cleanProfessional: string;
    musicFocused: string;
    shortMobileFriendly: string;
  };
  generatedDescription: string;
  suggestedPlaylist: string;
  searchIntent: string;
  contentPositioning: string;
  seoScore: number;
  scoreBreakdown: {
    titleOptimization: number;
    keywordDensity: number;
    tagCoverage: number;
    descriptionStructure: number;
    audienceMatch: number;
    notes: string[];
  };
  createdAt: string;
}

export interface AnalyticsSnapshot {
  timestamp: string;
  period: '7d' | '28d' | '90d';
  views: number;
  watchTimeHours: number;
  avgViewDurationSec: number;
  ctrPercent: number;
  likes: number;
  comments: number;
  subscribersGained: number;
  trend: 'up' | 'down' | 'steady';
  dailyData: Array<{
    date: string;
    views: number;
    likes: number;
    subscribers: number;
    watchTimeHours: number;
  }>;
}

export interface AIChannelHealth {
  analyzedAt: string;
  overallScore: number;
  summary: string;
  performingWell: string[];
  underperforming: string[];
  audienceInsights: string[];
  thumbnailAndTitleAdvice: string[];
  futureContentSuggestions: string[];
}

export interface MetadataChangeLog {
  id: string;
  videoId: string;
  videoTitle: string;
  field: 'title' | 'description' | 'tags' | 'thumbnail';
  before: string;
  after: string;
  reason: string;
  timestamp: string;
  status: 'applied' | 'pending_approval' | 'rejected';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  videoId?: string;
  title?: string;
  endpoint: string;
  status: 'success' | 'failure' | 'pending';
  errorMessage?: string;
  aiReasoning?: string;
  initiatedBy: 'user' | 'ai_autonomous' | 'ai_assisted';
}

export interface QuotaTracker {
  usedToday: number;
  limit: number;
  resetAt: string;
  lastUpdated: string;
  history: Array<{
    timestamp: string;
    operation: string;
    cost: number;
    details?: string;
  }>;
}

export interface DescriptionTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  isDefault?: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface AppSettings {
  channelName: string;
  ownerName: string;
  automationMode: AutomationMode;
  permissions: AutomationPermissions;
  uploadDefaults: {
    defaultPrivacy: 'private' | 'unlisted' | 'public';
    defaultCategory: string; // 10 = Music
    defaultLanguage: string; // 'ne'
    defaultPlaylist: string;
    defaultDescriptionTemplateId: string;
    aiDisclosureDefault: boolean;
  };
  googleCredentialsConfigured: boolean;
  hasGeminiKey: boolean;
  ffmpegAvailable: boolean;
}
