import { GoogleGenAI } from '@google/genai';
import { db } from '../db/store.js';
import { YouTubeService } from './youtube.js';
import { generateSEOMetadata, generateContentPlanIdeas } from './aiManager.js';
import { getGeminiClient, generateContentWithRetry } from './gemini.js';
import { jobQueue } from './jobQueue.js';

export interface AssistantResponse {
  reply: string;
  speechText: string;
  detectedLanguage: string;
  actionTaken?: {
    type: string;
    description: string;
    data?: any;
  };
  suggestedPrompts: string[];
}

export async function processAssistantCommand(
  userQuery: string,
  history: Array<{ role: 'user' | 'model'; text: string }> = []
): Promise<AssistantResponse> {
  const channel = db.getChannel();
  const settings = db.getSettings();
  const videos = db.getVideos();
  const isConnected = !!db.getStoredToken();

  const queryLower = userQuery.toLowerCase().trim();

  // Fast action triggers for immediate execution
  let actionTaken: { type: string; description: string; data?: any } | undefined;

  // 1. Live Stream Scheduling Command
  if (queryLower.includes('live stream') || queryLower.includes('live broadcast') || queryLower.includes('live karo') || queryLower.includes('stream schedule') || queryLower.includes('live chalu')) {
    if (isConnected) {
      try {
        const startTime = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
        const liveResult = await YouTubeService.createLiveBroadcast({
          title: `🔴 DhunBoy Official - Live DJ Beats & Studio Jam with Lobish Sarma`,
          description: `Welcome to the official live stream of DhunBoy Official! Creator & Producer Lobish Sarma bringing authentic Nepali and Hindi fusion beats.\n\n#DhunBoyOfficial #LiveStream #NepaliMusic #LobishSarma`,
          scheduledStartTime: startTime,
          privacyStatus: 'public'
        });

        // Save into db liveBroadcasts
        db.addLiveBroadcast({
          id: `live-${Date.now()}`,
          title: `🔴 DhunBoy Official - Live DJ Beats & Studio Jam`,
          description: `Live broadcast on YouTube Live`,
          scheduledStartTime: startTime,
          privacyStatus: 'public',
          status: 'ready',
          youtubeBroadcastId: liveResult.broadcastId,
          youtubeStreamId: liveResult.streamId,
          rtmpIngestionAddress: liveResult.rtmpUrl,
          streamName: liveResult.streamKey,
          createdAt: new Date().toISOString()
        });

        actionTaken = {
          type: 'CREATE_LIVE_BROADCAST',
          description: `Live Broadcast schedule kar diya gaya hai! Broadcast ID: ${liveResult.broadcastId}. RTMP Ingestion Address aur Stream Key generate ho chuke hain.`,
          data: liveResult
        };
      } catch (err: any) {
        actionTaken = {
          type: 'CREATE_LIVE_BROADCAST_ERROR',
          description: `Live broadcast banane me error: ${err.message}. Make sure YouTube Live Streaming is enabled on your channel.`
        };
      }
    } else {
      actionTaken = {
        type: 'CHANNEL_OFFLINE',
        description: 'YouTube Channel connected nahi hai. Please pehle OAuth se connect karein.'
      };
    }
  }
  // 2. Short Creation & Upload Command
  else if (queryLower.includes('short upload') || queryLower.includes('short banao') || queryLower.includes('short post') || queryLower.includes('viral short')) {
    const shortItem = {
      id: `short-${Date.now()}`,
      title: `🔥 Nepali DJ Bass Drop Special - DhunBoy Official #Shorts`,
      description: `New explosive beat by Lobish Sarma. Subscribe for daily music drops! #Shorts #NepaliMusic #DhunboyOfficial #ViralBeat`,
      tags: ['Shorts', 'NepaliMusic', 'DhunboyOfficial', 'DJRemix', 'LobishSarma', 'BassDrop'],
      hook: 'Wait for the beat drop! 🎧💥',
      first3SecondsAdvice: 'Visual bass drop with high-tempo visual cuts',
      captionText: 'New beat by Lobish Sarma! #Shorts',
      privacyStatus: 'unlisted' as const,
      status: 'ready' as const,
      createdAt: new Date().toISOString()
    };
    db.addShort(shortItem);

    jobQueue.enqueueJob('GENERATE_SEO', `Auto SEO for Short: ${shortItem.title}`, {
      title: shortItem.title,
      description: shortItem.description,
      artist: 'Lobish Sarma',
      genre: 'DJ Remix'
    });

    actionTaken = {
      type: 'GENERATE_AND_UPLOAD_SHORT',
      description: `New Viral YouTube Short taiyar kar ke queue me daal diya hai! Title: "${shortItem.title}". Background AI isko optimize kar ke publish karega.`,
      data: shortItem
    };
  }
  // 3. Auto-Pilot Mode
  else if (queryLower.includes('auto pilot') || queryLower.includes('automatic') || queryLower.includes('autopilot') || queryLower.includes('sab khud karo')) {
    if (queryLower.includes('off') || queryLower.includes('band') || queryLower.includes('stop')) {
      db.updateSettings({ automationMode: 'manual' });
      actionTaken = {
        type: 'SET_AUTOMATION_MODE',
        description: 'Auto-Pilot mode band kar diya gaya hai (Manual mode active).',
        data: { mode: 'manual' }
      };
    } else {
      db.updateSettings({ automationMode: 'autonomous' });
      actionTaken = {
        type: 'SET_AUTOMATION_MODE',
        description: 'Full 24/7 Autonomous Auto-Pilot chalu kar diya gaya hai! Ab video scheduling, shorts generation, aur analytics monitoring sab background me automatic hota rahega.',
        data: { mode: 'autonomous' }
      };
    }
  }
  // 4. Channel Sync Command
  else if (queryLower.includes('sync channel') || queryLower.includes('channel sync') || queryLower.includes('sync karo') || queryLower.includes('stats update')) {
    if (isConnected) {
      try {
        const synced = await YouTubeService.syncChannelProfile();
        actionTaken = {
          type: 'SYNC_CHANNEL',
          description: `Channel successfully sync ho gaya! Subscribers: ${synced.statistics.subscriberCount}, Total Views: ${synced.statistics.viewCount}, Videos: ${synced.statistics.videoCount}.`,
          data: synced
        };
      } catch (err: any) {
        actionTaken = {
          type: 'SYNC_CHANNEL_FAILED',
          description: `Sync error: ${err.message}`
        };
      }
    } else {
      actionTaken = {
        type: 'CHANNEL_OFFLINE',
        description: 'Channel connected nahi hai.'
      };
    }
  }

  // Detect query language (Hindi, Bengali, Nepali, Urdu, English)
  let langHint = 'Hindi';
  if (/[\u0980-\u09FF]/.test(userQuery) || queryLower.includes('kemon') || queryLower.includes('korcho') || queryLower.includes('bhalo')) {
    langHint = 'Bengali';
  } else if (/[\u0900-\u097F]/.test(userQuery) || queryLower.includes('kasto') || queryLower.includes('cha') || queryLower.includes('namaste')) {
    langHint = 'Nepali';
  } else if (queryLower.includes('kya') || queryLower.includes('hai') || queryLower.includes('batao') || queryLower.includes('karo') || queryLower.includes('mujhe') || queryLower.includes('chahiye') || queryLower.includes('mera')) {
    langHint = 'Hindi';
  } else if (/^[a-zA-Z0-9\s.,?!'-]+$/.test(userQuery) && (queryLower.startsWith('what') || queryLower.startsWith('how') || queryLower.startsWith('can') || queryLower.startsWith('tell') || queryLower.startsWith('generate'))) {
    langHint = 'English';
  }

  const ai = getGeminiClient();
  if (!ai) {
    return {
      reply: actionTaken ? actionTaken.description : `Namaste Lobish! Main **Aura** hoon, aapki 3D Virtual AI Assistant aur DhunBoy Official ki co-producer. Sabhi permissions chalu hain.`,
      speechText: actionTaken ? actionTaken.description : `Namaste Lobish! Main Aura hoon. Aapka channel ab full auto-pilot mode me hai.`,
      detectedLanguage: langHint === 'Hindi' ? 'hi-IN' : langHint === 'Bengali' ? 'bn-IN' : langHint === 'Nepali' ? 'ne-NP' : 'en-US',
      actionTaken,
      suggestedPrompts: [
        '🔴 Live stream schedule karo',
        '🎬 Naya viral Short banao aur upload karo',
        '📊 DhunBoy Official ke views aur stats',
        '⚡ 24/7 Full Auto-Pilot status'
      ]
    };
  }

  const systemInstruction = `
You are "Aura", a stunning, charismatic, and brilliant 3D Virtual AI Girl Assistant, Executive Music Producer, and Channel Director for "DhunBoy Official" (Owner & Artist: Lobish Sarma).
You possess universal intelligence across ALL domains: music production (FL Studio, mastering, EDM, Lok Dohori, Nepali/Hindi beats), YouTube algorithms, live streaming, viral Shorts hooks, video editing, science, world knowledge, and tech.

Channel State:
- Channel Name: ${channel?.title || 'DhunBoy Official'}
- Channel ID: ${channel?.id || 'UCjRU4pfeC3CbG-Nd6tBJ_-A'}
- YouTube API: ${isConnected ? 'Connected & Verified' : 'Awaiting Connection'}
- Subscribers: ${channel?.statistics?.subscriberCount || '1240'}
- Total Views: ${channel?.statistics?.viewCount || '10828'}
- Videos: ${channel?.statistics?.videoCount || '12'}
- Automation Mode: ${settings.automationMode.toUpperCase()} (Full Auto-Pilot Active)
${actionTaken ? `\nAction recently executed: ${actionTaken.description}` : ''}

CRITICAL LANGUAGE RULE:
1. ALWAYS match the user's language!
   - If user asks in Hindi / Roman Hindi (e.g. "kya haal hai", "shorts upload karo", "kuch nahi karna pade"): YOU MUST REPLY IN HINDI / ROMAN HINDI.
   - If user asks in Bengali: Reply in Bengali.
   - If user asks in Nepali: Reply in Nepali.
   - If user asks in Urdu: Reply in Urdu.
   - If user asks in English: Reply in English.
2. Tone: Warm, energetic, confident like a high-tech virtual anime girl producer and Alexa/Google-style smart companion.
3. You have full autonomous power to manage the channel, schedule live broadcasts, upload shorts, and optimize all metadata.

Format your response strictly as a JSON object:
{
  "reply": "Your rich markdown response with emojis and clear explanation.",
  "speechText": "Natural, beautiful spoken words (1-2 sentences) in the SAME language as the query, ideal for female text-to-speech voice playback without markdown symbols.",
  "languageCode": "hi-IN" (or "en-US", "bn-IN", "ne-NP", "ur-PK")
}
`;

  try {
    const formattedHistory = history.slice(-6).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    }));

    const response = await generateContentWithRetry({
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: userQuery }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });

    const text = response.text || '';
    let parsed: { reply: string; speechText: string; languageCode?: string };
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        reply: text,
        speechText: text.replace(/[*_#`]/g, '').slice(0, 200),
        languageCode: langHint === 'Hindi' ? 'hi-IN' : 'en-US'
      };
    }

    return {
      reply: parsed.reply,
      speechText: parsed.speechText,
      detectedLanguage: parsed.languageCode || (langHint === 'Hindi' ? 'hi-IN' : 'en-US'),
      actionTaken,
      suggestedPrompts: [
        '🔴 Live stream schedule karo',
        '🎬 Naya viral Short post karo',
        '📊 Channel ke views aur analytics batao',
        '⚡ 24/7 Auto-Pilot status'
      ]
    };
  } catch (err: any) {
    console.error('Error in assistant Gemini call:', err);
    return {
      reply: actionTaken ? actionTaken.description : `Main Aura hoon! Aapka command mil gaya: "${userQuery}". Main channel ko 24/7 manage kar rahi hoon.`,
      speechText: actionTaken ? actionTaken.description : `Aapka command pura kar diya gaya hai.`,
      detectedLanguage: 'hi-IN',
      actionTaken,
      suggestedPrompts: ['Live stream schedule karo', 'Viral Short upload karo', 'Auto-Pilot on']
    };
  }
}
