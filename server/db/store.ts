import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  resolveGoogleClientId,
  resolveGoogleClientSecret,
  resolveGeminiApiKey,
  resolveYouTubeApiKey
} from '../config/env.js';
import {
  YouTubeChannel,
  StoredOAuthToken,
  VideoRecord,
  ShortRecord,
  PlaylistRecord,
  LiveBroadcastRecord,
  BackgroundJob,
  ContentPlanItem,
  SEORecord,
  AnalyticsSnapshot,
  AIChannelHealth,
  MetadataChangeLog,
  ActivityLog,
  QuotaTracker,
  DescriptionTemplate,
  AppNotification,
  AppSettings,
  AutomationPermissions
} from '../types.js';

interface DatabaseSchema {
  settings: AppSettings;
  channel: YouTubeChannel | null;
  oauthToken: StoredOAuthToken | null;
  googleClientConfig: {
    clientId: string;
    clientSecret: string;
    configuredManually: boolean;
  };
  apiKeys?: {
    geminiApiKey?: string;
    youtubeApiKey?: string;
  };
  videos: VideoRecord[];
  shorts: ShortRecord[];
  playlists: PlaylistRecord[];
  liveBroadcasts: LiveBroadcastRecord[];
  jobs: BackgroundJob[];
  contentPlans: ContentPlanItem[];
  seoRecords: SEORecord[];
  analyticsSnapshots: Record<string, AnalyticsSnapshot>;
  channelHealth: AIChannelHealth | null;
  metadataChangeLogs: MetadataChangeLog[];
  activityLogs: ActivityLog[];
  quota: QuotaTracker;
  descriptionTemplates: DescriptionTemplate[];
  notifications: AppNotification[];
}

const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp/data' : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

const DEFAULT_TEMPLATES: DescriptionTemplate[] = [
  {
    id: 'tpl-nepali-song',
    name: 'Nepali Song (Standard)',
    category: 'Nepali Song',
    isDefault: true,
    template: `🎵 {{TITLE}} | Dhunboy Official

Presenting the official release of "{{TITLE}}" by {{ARTIST}}. Experience the authentic rhythm and soul of Nepali music. 

━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 SONG & PRODUCTION CREDITS:
━━━━━━━━━━━━━━━━━━━━━━━━━━
▸ Song Title: {{TITLE}}
▸ Artist/Vocals: {{ARTIST}}
▸ Music & Arrangement: Dhunboy Official
▸ Genre: {{SONG_TYPE}}
▸ Sound Design & Master: Lobish Sarma
{{CREDITS}}

{{AI_DISCLOSURE}}

━━━━━━━━━━━━━━━━━━━━━━━━━━
🔔 STAY CONNECTED WITH DHUNBOY OFFICIAL:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Subscribe to {{CHANNEL}} for fresh Nepali music, folk beats, and DJ remixes:
https://www.youtube.com/@DhunboyOfficial

Follow Lobish Sarma:
{{SOCIAL_LINKS}}

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ COPYRIGHT & DISCLAIMER:
━━━━━━━━━━━━━━━━━━━━━━━━━━
© {{CHANNEL}} & Lobish Sarma. All Rights Reserved.
Unauthorized downloading, re-uploading, or public distribution of this audio/video track on any digital platform without prior written permission is strictly prohibited and subject to legal action under copyright law.

#DhunboyOfficial #NepaliSong #{{SONG_TYPE}} #LobishSarma #NepaliMusic`
  },
  {
    id: 'tpl-nepali-dj-remix',
    name: 'Nepali DJ Remix / Club Dance',
    category: 'Nepali DJ Remix',
    template: `🔥 {{TITLE}} (Nepali DJ Remix) | Dhunboy Official

Get ready to turn up the bass! Dhunboy Official presents the high-energy club and festival remix of "{{TITLE}}". 

━━━━━━━━━━━━━━━━━━━━━━━━━━
🎧 REMIX & AUDIO CREDITS:
━━━━━━━━━━━━━━━━━━━━━━━━━━
▸ Track: {{TITLE}}
▸ Original Artist: {{ARTIST}}
▸ Remixed & Produced by: Dhunboy Official
▸ Bass & Beats Programming: Lobish Sarma
▸ Style: {{SONG_TYPE}} / Nepali Dance Club Mix
{{CREDITS}}

{{AI_DISCLOSURE}}

━━━━━━━━━━━━━━━━━━━━━━━━━━
▶️ PLAYLIST & STREAMING:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Best for parties, DJ sets, weddings, and dance lovers!
Turn on notifications (🔔) for non-stop party vibes.

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚖️ COPYRIGHT NOTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━
Original compositions belong to their respective copyright holders. This creative remix was produced for promotional & entertainment celebration purposes. Contact dhunboyofficial@gmail.com for inquiries.

#NepaliDJRemix #DhunboyOfficial #NepaliDanceSong #BassBoosted #ClubRemix #LobishSarma`
  },
  {
    id: 'tpl-lok-dohori',
    name: 'Nepali Lok Dohori / Traditional Folk',
    category: 'Lok Dohori',
    template: `🌾 {{TITLE}} | New Nepali Lok Dohori Geet | Dhunboy Official

आदरणीय दर्शक तथा स्रोतावृन्द, धुनब्वाई अफिसियलको तर्फबाट नयाँ मौलिक नेपाली लोक दोहोरी गीत "{{TITLE}}" प्रस्तुत गर्दछौं।

━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 मुख्य कलाकार तथा प्राविधिक विवरण:
━━━━━━━━━━━━━━━━━━━━━━━━━━
▸ गीत: {{TITLE}}
▸ स्वर: {{ARTIST}}
▸ संगीत संकलन / संयोजन: Dhunboy Official
▸ प्रकार: {{SONG_TYPE}}
{{CREDITS}}

{{AI_DISCLOSURE}}

━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ हाम्रो च्यानललाई सस्क्राईब गरी नेपाली मौलिक लोक संस्कृतिलाई साथ दिनुहोला:
{{CHANNEL}} - Dhunboy Official
निर्माता: Lobish Sarma

#LokDohori #NepaliFolk #DhunboyOfficial #NepaliGeet #LobishSarma`
  },
  {
    id: 'tpl-teej-festival',
    name: 'Nepali Teej / Festival Celebration',
    category: 'Teej Song',
    template: `🪔 {{TITLE}} | New Nepali Teej Special Song | Dhunboy Official

सम्पूर्ण दिदीबहिनी तथा आमाहरुमा हरितालिका तीजको पावन अवसरमा धुनब्वाई अफिसियलको विशेष सांगीतिक सौगात!

━━━━━━━━━━━━━━━━━━━━━━━━━━
🎶 गीतको विवरण (Song Details):
━━━━━━━━━━━━━━━━━━━━━━━━━━
▸ गीतको बोल: {{TITLE}}
▸ गायन: {{ARTIST}}
▸ संगीत / एरेन्ज: Dhunboy Official (Lobish Sarma)
▸ विधा: {{SONG_TYPE}}
{{CREDITS}}

{{AI_DISCLOSURE}}

Happy Teej & Festive Season to all Nepalese worldwide!
Subscribe to {{CHANNEL}} for festival specials.

#TeejSong #NepaliFestival #DhunboyOfficial #TeejGeet #LobishSarma`
  },
  {
    id: 'tpl-shorts',
    name: 'YouTube Shorts Format',
    category: 'Shorts',
    template: `{{TITLE}} 🎵🔥
Singer: {{ARTIST}} | Label: Dhunboy Official

{{AI_DISCLOSURE}}

Subscribe for daily Nepali music drops!
#Shorts #YouTubeShorts #NepaliMusic #DhunboyOfficial #NepaliSong`
  },
  {
    id: 'tpl-ai-assisted',
    name: 'AI-Assisted Music Disclosure',
    category: 'AI-Assisted Music',
    template: `✨ {{TITLE}} | Modern Nepali Musical Fusion | Dhunboy Official

Artist: {{ARTIST}}
Executive Producer: Lobish Sarma (Dhunboy Official)

━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 AI TRANSPARENCY & ETHICS DISCLOSURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━
AI Disclosure:
This content was created with the assistance of modern digital and AI audio tools. Lyrics, melody/tune, vocal synthesis, sound engineering, or visual artwork include AI-assisted elements as crafted, curated, and mastered by Lobish Sarma for Dhunboy Official.

━━━━━━━━━━━━━━━━━━━━━━━━━━
Credits & Rights:
{{CREDITS}}
© {{CHANNEL}}. All Rights Reserved.`
  }
];

const DEFAULT_PERMISSIONS: AutomationPermissions = {
  generateTitles: true,
  generateDescriptions: true,
  generateKeywords: true,
  generateTags: true,
  generateHashtags: true,
  createPlaylists: false,
  uploadVideos: false, // Default dangerous actions OFF
  uploadShorts: false,
  scheduleVideos: false,
  publishVideos: false,
  updateMetadata: false,
  createLiveBroadcasts: false,
  streamWorkflow: false,
  analyzeAnalytics: true,
  generateContentIdeas: true,
  autoOptimizeMetadata: false
};

const DEFAULT_SETTINGS: AppSettings = {
  channelName: 'Dhunboy Official',
  ownerName: 'Lobish Sarma',
  automationMode: 'assisted', // Safe default: prepare and ask for confirmation
  permissions: DEFAULT_PERMISSIONS,
  uploadDefaults: {
    defaultPrivacy: 'unlisted',
    defaultCategory: '10', // Music
    defaultLanguage: 'ne', // Nepali
    defaultPlaylist: '',
    defaultDescriptionTemplateId: 'tpl-nepali-song',
    aiDisclosureDefault: false
  },
  googleCredentialsConfigured: false,
  hasGeminiKey: !!process.env.GEMINI_API_KEY,
  ffmpegAvailable: true
};

class DatabaseStore {
  private data: DatabaseSchema;
  private encryptionKey: Buffer;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const SECRET_BACKUP_FILE = path.join(DATA_DIR, '.secret_vault');
    let secret = process.env.ENCRYPTION_SECRET;
    if (!secret && fs.existsSync(SECRET_BACKUP_FILE)) {
      try {
        secret = fs.readFileSync(SECRET_BACKUP_FILE, 'utf-8').trim();
      } catch {
        // ignore
      }
    }

    if (secret && secret.trim().length >= 32) {
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(SECRET_BACKUP_FILE, secret.trim(), 'utf-8');
      } catch {
        // ignore
      }
    }

    if (!secret || secret.trim().length < 32) {
      const fallbackSeed = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_URL || 'dhunboy_official_lobish_sarma_nepali_music_production_vault_2026';
      secret = crypto.createHash('sha256').update(fallbackSeed).digest('hex');
      process.env.ENCRYPTION_SECRET = secret;
    }

    this.encryptionKey = crypto.createHash('sha256').update(secret.trim()).digest();

    this.data = this.loadDatabase();
    this.refreshSettingsStatus();
  }

  private loadDatabase(): DatabaseSchema {
    let parsed: any = null;
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        parsed = JSON.parse(raw);
      } catch (err) {
        console.error('Error reading database file, initializing defaults:', err);
      }
    }

    // Secondary vault file for credential persistence across cold-starts
    const VAULT_FILE = path.join(DATA_DIR, 'credentials_vault.json');
    let vaultCredentials: any = {};
    if (fs.existsSync(VAULT_FILE)) {
      try {
        vaultCredentials = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf-8'));
      } catch {
        // ignore
      }
    }

    if (parsed) {
      return {
        ...parsed,
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings || {}),
          permissions: {
            ...DEFAULT_PERMISSIONS,
            ...(parsed.settings?.permissions || {})
          }
        },
        googleClientConfig: {
          clientId: process.env.GOOGLE_CLIENT_ID || vaultCredentials.clientId || '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || vaultCredentials.clientSecret || '',
          configuredManually: false,
          ...(parsed.googleClientConfig || {})
        },
        apiKeys: {
          geminiApiKey: vaultCredentials.geminiApiKey || '',
          youtubeApiKey: vaultCredentials.youtubeApiKey || '',
          ...(parsed.apiKeys || {})
        },
        descriptionTemplates: parsed.descriptionTemplates?.length
          ? parsed.descriptionTemplates
          : DEFAULT_TEMPLATES
      };
    }

    const initial: DatabaseSchema = {
      settings: DEFAULT_SETTINGS,
      channel: {
        id: 'UC_DhunboyOfficial',
        title: 'Dhunboy Official',
        customUrl: '@DhunboyOfficial',
        description: 'Official YouTube channel for Lobish Sarma (Dhunboy Official). Home of Nepali songs, DJ remixes, Lok Dohori, Teej specials, modern dance beats, and fusion music.',
        publishedAt: '2023-01-15T00:00:00Z',
        thumbnails: {
          default: { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80' },
          medium: { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80' },
          high: { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80' }
        },
        statistics: {
          viewCount: '245890',
          subscriberCount: '12400',
          hiddenSubscriberCount: false,
          videoCount: '34'
        },
        connectedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString()
      },
      oauthToken: null,
      googleClientConfig: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        configuredManually: false
      },
      videos: [],
      shorts: [],
      playlists: [
        {
          id: 'pl-nepali-songs',
          youtubePlaylistId: '',
          title: 'New Nepali Songs 2026',
          description: 'Latest official Nepali hits and melodic releases by Dhunboy Official',
          privacyStatus: 'public',
          itemCount: 14,
          createdAt: new Date().toISOString()
        },
        {
          id: 'pl-dj-remixes',
          youtubePlaylistId: '',
          title: 'Nepali DJ Remix Club Bass',
          description: 'High energy festival & dance remixes by Lobish Sarma',
          privacyStatus: 'public',
          itemCount: 9,
          createdAt: new Date().toISOString()
        },
        {
          id: 'pl-lok-dohori',
          youtubePlaylistId: '',
          title: 'Nepali Lok Dohori & Folk Beats',
          description: 'Authentic cultural beats and traditional melody creations',
          privacyStatus: 'public',
          itemCount: 6,
          createdAt: new Date().toISOString()
        },
        {
          id: 'pl-shorts',
          youtubePlaylistId: '',
          title: 'Dhunboy Shorts Drops',
          description: 'Vertical music teasers and viral loops',
          privacyStatus: 'public',
          itemCount: 18,
          createdAt: new Date().toISOString()
        }
      ],
      liveBroadcasts: [],
      jobs: [],
      contentPlans: [
        {
          id: 'plan-1',
          topic: 'Nepali Dashain DJ Party Remix Mashup',
          proposedTitle: 'Dashain Festival DJ Mashup 2026 | Dhunboy Official',
          format: 'DJ Remix',
          hook: 'First 3 seconds drop with traditional Madal blended into 128 BPM electronic bass kick.',
          keywords: ['Dashain DJ Remix', 'Nepali Party Song', 'Lobish Sarma', 'Dhunboy Mashup'],
          hashtags: ['#DashainSpecial', '#NepaliDJRemix', '#DhunboyOfficial'],
          suggestedUploadDate: '2026-10-01T17:00:00Z',
          reason: 'High seasonal search interest for party and festival music in Nepal and diaspora.',
          status: 'planned',
          createdAt: new Date().toISOString()
        },
        {
          id: 'plan-2',
          topic: 'Modern Lok Dohori Melody Fusion',
          proposedTitle: 'Phool Ko Dali (Modern Lok Beat) - Dhunboy Official',
          format: 'Lok Dohori',
          hook: 'Vocal flute intro followed by an acoustic sarangi lead hook.',
          keywords: ['Nepali Lok Dohori', 'Phool Ko Dali', 'New Nepali Song 2026', 'Dhunboy'],
          hashtags: ['#LokDohori', '#NepaliFolk', '#LobishSarma'],
          suggestedUploadDate: '2026-10-08T16:00:00Z',
          reason: 'Strong retention on folk melody fusion with modern audio mastering.',
          status: 'idea',
          createdAt: new Date().toISOString()
        }
      ],
      seoRecords: [],
      analyticsSnapshots: {
        '28d': {
          timestamp: new Date().toISOString(),
          period: '28d',
          views: 68400,
          watchTimeHours: 3240,
          avgViewDurationSec: 172,
          ctrPercent: 7.8,
          likes: 4120,
          comments: 630,
          subscribersGained: 780,
          trend: 'up',
          dailyData: Array.from({ length: 28 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (27 - i));
            return {
              date: d.toISOString().split('T')[0],
              views: Math.floor(1800 + Math.sin(i / 3) * 600 + Math.random() * 400),
              likes: Math.floor(110 + Math.random() * 50),
              subscribers: Math.floor(20 + Math.random() * 15),
              watchTimeHours: Math.floor(90 + Math.random() * 30)
            };
          })
        }
      },
      channelHealth: {
        analyzedAt: new Date().toISOString(),
        overallScore: 88,
        summary: 'Dhunboy Official maintains high audience loyalty in the Nepali dance and folk remix genres. CTR on DJ remixes is performing above platform benchmark (7.8% vs 4.5% avg).',
        performingWell: [
          'High bass Nepali DJ Remix tracks generate 3.2x higher replay rates than standard uploads.',
          'YouTube Shorts with clear first-second music drops show 68% audience retention past 10 seconds.',
          'Playlists "New Nepali Songs 2026" drives 24% of overall channel session watch time.'
        ],
        underperforming: [
          'Titles without romanized Nepali keywords miss diaspora audiences searching without Devanagari keyboards.',
          'Video descriptions on earlier uploads lack structured timestamps and copyright notices.'
        ],
        audienceInsights: [
          'Peak viewing hours for your audience are 18:00 - 22:00 NPT (Nepal Time) and weekends.',
          '62% of traffic originates from mobile devices browsing Shorts feed and Suggested Videos.'
        ],
        thumbnailAndTitleAdvice: [
          'Use high contrast dark backgrounds with bold neon typography for DJ releases.',
          'Include the song genre or tempo tag [DJ Remix / Lok Pop] in brackets at the end of titles.'
        ],
        futureContentSuggestions: [
          'Release a 15-second teaser Short 48 hours before every full-length track upload.',
          'Host a scheduled YouTube Live music premiere session to boost early algorithm velocity.'
        ]
      },
      metadataChangeLogs: [],
      activityLogs: [
        {
          id: 'act-init',
          timestamp: new Date().toISOString(),
          action: 'AI YouTube Manager initialized for Dhunboy Official (Lobish Sarma)',
          endpoint: '/api/init',
          status: 'success',
          aiReasoning: 'Manager system online with safe default permissions.',
          initiatedBy: 'ai_autonomous'
        }
      ],
      quota: {
        usedToday: 140,
        limit: 10000,
        resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
        lastUpdated: new Date().toISOString(),
        history: [
          {
            timestamp: new Date().toISOString(),
            operation: 'channels.list',
            cost: 1,
            details: 'Initial channel metadata synchronization'
          }
        ]
      },
      descriptionTemplates: DEFAULT_TEMPLATES,
      notifications: [
        {
          id: 'notif-welcome',
          title: 'Dhunboy AI YouTube Manager Ready',
          message: 'System online for Dhunboy Official. Configure your Google Cloud OAuth credentials to link the live channel API.',
          type: 'info',
          timestamp: new Date().toISOString(),
          read: false,
          link: '/settings'
        }
      ]
    };

    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.data = data;

      // Also persist credentials into a dedicated vault backup
      const VAULT_FILE = path.join(DATA_DIR, 'credentials_vault.json');
      const vaultPayload = {
        clientId: data.googleClientConfig?.clientId || '',
        clientSecret: data.googleClientConfig?.clientSecret || '',
        geminiApiKey: data.apiKeys?.geminiApiKey || '',
        youtubeApiKey: data.apiKeys?.youtubeApiKey || '',
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(VAULT_FILE, JSON.stringify(vaultPayload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save database file:', err);
      this.data = data;
    }
  }

  public refreshSettingsStatus() {
    const creds = this.getGoogleCredentials();
    this.data.settings.googleCredentialsConfigured = creds.isConfigured;
    this.data.settings.hasGeminiKey = this.hasGeminiKey();
  }

  public getSettings(): AppSettings {
    this.refreshSettingsStatus();
    return this.data.settings;
  }

  public updateSettings(partial: Partial<AppSettings>): AppSettings {
    this.data.settings = {
      ...this.data.settings,
      ...partial,
      permissions: {
        ...this.data.settings.permissions,
        ...(partial.permissions || {})
      },
      uploadDefaults: {
        ...this.data.settings.uploadDefaults,
        ...(partial.uploadDefaults || {})
      }
    };
    this.saveDatabase(this.data);
    return this.data.settings;
  }

  public getGoogleCredentials() {
    const cfg = this.data?.googleClientConfig || { clientId: '', clientSecret: '', configuredManually: false };
    let clientId = (
      resolveGoogleClientId() ||
      cfg.clientId ||
      ''
    ).trim();
    clientId = clientId.replace(/^https?:\/\//i, '').replace(/["']/g, '').trim();

    const clientSecret = (
      resolveGoogleClientSecret() ||
      cfg.clientSecret ||
      ''
    ).replace(/["']/g, '').trim();

    return {
      clientId,
      clientSecret,
      isConfigured: !!(clientId && clientSecret)
    };
  }

  public setGoogleCredentials(clientId?: string, clientSecret?: string) {
    if (!this.data.googleClientConfig) {
      this.data.googleClientConfig = {
        clientId: '',
        clientSecret: '',
        configuredManually: false
      };
    }

    if (clientId !== undefined && clientId !== null) {
      this.data.googleClientConfig.clientId = String(clientId)
        .trim()
        .replace(/^https?:\/\//i, '')
        .replace(/["']/g, '')
        .trim();
    }

    if (clientSecret !== undefined && clientSecret !== null) {
      this.data.googleClientConfig.clientSecret = String(clientSecret)
        .trim()
        .replace(/["']/g, '')
        .trim();
    }

    this.data.googleClientConfig.configuredManually = true;
    this.refreshSettingsStatus();
    this.saveDatabase(this.data);
  }

  public setEncryptionSecret(secret: string) {
    const cleanSecret = String(secret || '').trim();
    if (cleanSecret.length >= 16) {
      process.env.ENCRYPTION_SECRET = cleanSecret;
      const SECRET_BACKUP_FILE = path.join(DATA_DIR, '.secret_vault');
      try {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(SECRET_BACKUP_FILE, cleanSecret, 'utf-8');
      } catch {
        // ignore
      }
      this.encryptionKey = crypto.createHash('sha256').update(cleanSecret).digest();
    }
  }

  public getGeminiApiKey(): string {
    const envKey = resolveGeminiApiKey();
    if (envKey) return envKey;
    return (this.data?.apiKeys?.geminiApiKey || '').trim();
  }

  public setGeminiApiKey(key: string) {
    if (!this.data.apiKeys) this.data.apiKeys = {};
    this.data.apiKeys.geminiApiKey = String(key || '').trim();
    this.refreshSettingsStatus();
    this.saveDatabase(this.data);
  }

  public hasGeminiKey(): boolean {
    return !!this.getGeminiApiKey();
  }

  public getYouTubeApiKey(): string {
    const envKey = resolveYouTubeApiKey();
    if (envKey) return envKey;
    return (this.data?.apiKeys?.youtubeApiKey || '').trim();
  }

  public setYouTubeApiKey(key: string) {
    if (!this.data.apiKeys) this.data.apiKeys = {};
    this.data.apiKeys.youtubeApiKey = String(key || '').trim();
    this.saveDatabase(this.data);
  }

  public hasYouTubeApiKey(): boolean {
    return !!this.getYouTubeApiKey();
  }

  public encryptToken(token: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(token, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  public decryptToken(encryptedData: string): string {
    const [ivHex, cipherText] = encryptedData.split(':');
    if (!ivHex || !cipherText) return '';
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(cipherText, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');
      return decrypted;
    } catch {
      return '';
    }
  }

  public getStoredToken(): StoredOAuthToken | null {
    return this.data.oauthToken;
  }

  public setStoredToken(token: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
    tokenType?: string;
    scope?: string[];
  }) {
    this.data.oauthToken = {
      encryptedAccessToken: this.encryptToken(token.accessToken),
      encryptedRefreshToken: this.encryptToken(token.refreshToken),
      expiryDate: token.expiryDate,
      tokenType: token.tokenType || 'Bearer',
      scope: token.scope || []
    };
    this.saveDatabase(this.data);
  }

  public clearOAuthToken() {
    this.data.oauthToken = null;
    this.data.channel = null;
    this.saveDatabase(this.data);
  }

  public getChannel(): YouTubeChannel | null {
    if (!this.data.oauthToken) {
      return null;
    }
    return this.data.channel;
  }

  public setChannel(channel: YouTubeChannel) {
    this.data.channel = channel;
    this.saveDatabase(this.data);
  }

  public updateChannel(channel: YouTubeChannel) {
    this.data.channel = channel;
    this.saveDatabase(this.data);
  }

  // Videos
  public getVideos(): VideoRecord[] {
    return this.data.videos;
  }

  public getVideo(id: string): VideoRecord | undefined {
    return this.data.videos.find(v => v.id === id);
  }

  public addVideo(video: VideoRecord) {
    this.data.videos.unshift(video);
    this.saveDatabase(this.data);
  }

  public updateVideo(id: string, updates: Partial<VideoRecord>): VideoRecord | null {
    const idx = this.data.videos.findIndex(v => v.id === id);
    if (idx === -1) return null;
    this.data.videos[idx] = {
      ...this.data.videos[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveDatabase(this.data);
    return this.data.videos[idx];
  }

  public deleteVideo(id: string): boolean {
    const initialLen = this.data.videos.length;
    this.data.videos = this.data.videos.filter(v => v.id !== id);
    if (this.data.videos.length !== initialLen) {
      this.saveDatabase(this.data);
      return true;
    }
    return false;
  }

  // Shorts
  public getShorts(): ShortRecord[] {
    return this.data.shorts;
  }

  public addShort(short: ShortRecord) {
    this.data.shorts.unshift(short);
    this.saveDatabase(this.data);
  }

  public updateShort(id: string, updates: Partial<ShortRecord>): ShortRecord | null {
    const idx = this.data.shorts.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.shorts[idx] = { ...this.data.shorts[idx], ...updates };
    this.saveDatabase(this.data);
    return this.data.shorts[idx];
  }

  // Playlists
  public getPlaylists(): PlaylistRecord[] {
    return this.data.playlists;
  }

  public addPlaylist(pl: PlaylistRecord) {
    this.data.playlists.unshift(pl);
    this.saveDatabase(this.data);
  }

  // Live Broadcasts
  public getLiveBroadcasts(): LiveBroadcastRecord[] {
    return this.data.liveBroadcasts;
  }

  public addLiveBroadcast(broadcast: LiveBroadcastRecord) {
    this.data.liveBroadcasts.unshift(broadcast);
    this.saveDatabase(this.data);
  }

  public updateLiveBroadcast(id: string, updates: Partial<LiveBroadcastRecord>): LiveBroadcastRecord | null {
    const idx = this.data.liveBroadcasts.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.data.liveBroadcasts[idx] = { ...this.data.liveBroadcasts[idx], ...updates };
    this.saveDatabase(this.data);
    return this.data.liveBroadcasts[idx];
  }

  // Background Jobs
  public getJobs(): BackgroundJob[] {
    return this.data.jobs;
  }

  public addJob(job: BackgroundJob) {
    this.data.jobs.unshift(job);
    this.saveDatabase(this.data);
  }

  public updateJob(id: string, updates: Partial<BackgroundJob>): BackgroundJob | null {
    const idx = this.data.jobs.findIndex(j => j.id === id);
    if (idx === -1) return null;
    this.data.jobs[idx] = { ...this.data.jobs[idx], ...updates };
    this.saveDatabase(this.data);
    return this.data.jobs[idx];
  }

  // Content Plans
  public getContentPlans(): ContentPlanItem[] {
    return this.data.contentPlans;
  }

  public addContentPlan(plan: ContentPlanItem) {
    this.data.contentPlans.unshift(plan);
    this.saveDatabase(this.data);
  }

  public updateContentPlan(id: string, updates: Partial<ContentPlanItem>): ContentPlanItem | null {
    const idx = this.data.contentPlans.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.contentPlans[idx] = { ...this.data.contentPlans[idx], ...updates };
    this.saveDatabase(this.data);
    return this.data.contentPlans[idx];
  }

  public deleteContentPlan(id: string): boolean {
    const len = this.data.contentPlans.length;
    this.data.contentPlans = this.data.contentPlans.filter(p => p.id !== id);
    if (this.data.contentPlans.length !== len) {
      this.saveDatabase(this.data);
      return true;
    }
    return false;
  }

  // SEO Records
  public getSEORecords(): SEORecord[] {
    return this.data.seoRecords;
  }

  public addSEORecord(record: SEORecord) {
    this.data.seoRecords.unshift(record);
    this.saveDatabase(this.data);
  }

  // Analytics
  public getAnalytics(period: '7d' | '28d' | '90d'): AnalyticsSnapshot {
    if (!this.data.analyticsSnapshots[period]) {
      const days = period === '7d' ? 7 : period === '28d' ? 28 : 90;
      const snapshot: AnalyticsSnapshot = {
        timestamp: new Date().toISOString(),
        period,
        views: Math.floor(days * 2450),
        watchTimeHours: Math.floor(days * 115),
        avgViewDurationSec: 172,
        ctrPercent: 7.8,
        likes: Math.floor(days * 148),
        comments: Math.floor(days * 22),
        subscribersGained: Math.floor(days * 28),
        trend: 'up',
        dailyData: Array.from({ length: days }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          return {
            date: d.toISOString().split('T')[0],
            views: Math.floor(1900 + Math.sin(i / 2) * 500 + Math.random() * 300),
            likes: Math.floor(120 + Math.random() * 40),
            subscribers: Math.floor(22 + Math.random() * 12),
            watchTimeHours: Math.floor(95 + Math.random() * 25)
          };
        })
      };
      this.data.analyticsSnapshots[period] = snapshot;
      this.saveDatabase(this.data);
    }
    return this.data.analyticsSnapshots[period];
  }

  public updateAnalytics(period: '7d' | '28d' | '90d', snapshot: AnalyticsSnapshot) {
    this.data.analyticsSnapshots[period] = snapshot;
    this.saveDatabase(this.data);
  }

  public getChannelHealth(): AIChannelHealth | null {
    return this.data.channelHealth;
  }

  public setChannelHealth(health: AIChannelHealth) {
    this.data.channelHealth = health;
    this.saveDatabase(this.data);
  }

  // Activity Logs
  public logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>) {
    const entry: ActivityLog = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...activity
    };
    this.data.activityLogs.unshift(entry);
    // Keep max 500 logs
    if (this.data.activityLogs.length > 500) {
      this.data.activityLogs = this.data.activityLogs.slice(0, 500);
    }
    this.saveDatabase(this.data);
    return entry;
  }

  public getActivityLogs(limit = 100): ActivityLog[] {
    return this.data.activityLogs.slice(0, limit);
  }

  // Metadata change logs
  public logMetadataChange(change: Omit<MetadataChangeLog, 'id' | 'timestamp'>) {
    const entry: MetadataChangeLog = {
      id: `mlog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...change
    };
    this.data.metadataChangeLogs.unshift(entry);
    this.saveDatabase(this.data);
    return entry;
  }

  public getMetadataChangeLogs(): MetadataChangeLog[] {
    return this.data.metadataChangeLogs;
  }

  // Quota Management
  public recordQuotaUsage(operation: string, cost: number, details?: string) {
    const now = new Date();
    const resetTime = new Date(this.data.quota.resetAt);
    if (now >= resetTime) {
      this.data.quota.usedToday = 0;
      this.data.quota.resetAt = new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString();
    }
    this.data.quota.usedToday += cost;
    this.data.quota.lastUpdated = now.toISOString();
    this.data.quota.history.unshift({
      timestamp: now.toISOString(),
      operation,
      cost,
      details
    });
    if (this.data.quota.history.length > 200) {
      this.data.quota.history = this.data.quota.history.slice(0, 200);
    }
    this.saveDatabase(this.data);
  }

  public getQuota(): QuotaTracker {
    return this.data.quota;
  }

  // Description Templates
  public getDescriptionTemplates(): DescriptionTemplate[] {
    return this.data.descriptionTemplates;
  }

  public addDescriptionTemplate(tpl: DescriptionTemplate) {
    this.data.descriptionTemplates.push(tpl);
    this.saveDatabase(this.data);
  }

  public updateDescriptionTemplate(id: string, updates: Partial<DescriptionTemplate>): DescriptionTemplate | null {
    const idx = this.data.descriptionTemplates.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.descriptionTemplates[idx] = { ...this.data.descriptionTemplates[idx], ...updates };
    this.saveDatabase(this.data);
    return this.data.descriptionTemplates[idx];
  }

  public deleteDescriptionTemplate(id: string): boolean {
    const len = this.data.descriptionTemplates.length;
    this.data.descriptionTemplates = this.data.descriptionTemplates.filter(t => t.id !== id);
    if (this.data.descriptionTemplates.length !== len) {
      this.saveDatabase(this.data);
      return true;
    }
    return false;
  }

  // Notifications
  public getNotifications(): AppNotification[] {
    return this.data.notifications;
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) {
    const entry: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    };
    this.data.notifications.unshift(entry);
    if (this.data.notifications.length > 100) {
      this.data.notifications = this.data.notifications.slice(0, 100);
    }
    this.saveDatabase(this.data);
    return entry;
  }

  public markNotificationAsRead(id: string) {
    const n = this.data.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.saveDatabase(this.data);
    }
  }

  public markAllNotificationsAsRead() {
    this.data.notifications.forEach(n => { n.read = true; });
    this.saveDatabase(this.data);
  }
}

export const db = new DatabaseStore();
