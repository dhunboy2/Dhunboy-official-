import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  Bot,
  Zap,
  Radio,
  CheckCircle2,
  Maximize2,
  Minimize2,
  X,
  Play,
  RotateCw,
  TrendingUp,
  Music,
  Video,
  ShieldCheck,
  Languages,
  Headphones,
  BellRing
} from 'lucide-react';
import { api } from '../api';
import { Aura3DAvatar } from './Aura3DAvatar';

interface Message {
  id: string;
  sender: 'user' | 'aura';
  text: string;
  speechText?: string;
  detectedLanguage?: string;
  actionTaken?: {
    type: string;
    description: string;
    data?: any;
  };
  timestamp: string;
}

interface VirtualAIAssistantProps {
  onNavigate?: (tab: string) => void;
  onRefreshData?: () => void;
}

// Web Audio API Chime synthesizer (Google / Alexa style)
function playToneChime(type: 'wake' | 'success') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'wake') {
      // Alexa / Google rising chime (440Hz -> 660Hz)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);

      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.28);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.15);
      osc2.start(ctx.currentTime + 0.12);
      osc2.stop(ctx.currentTime + 0.35);
    } else {
      // Success completion bell
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch {
    // Ignore audio context errors if browser restricts
  }
}

export const VirtualAIAssistant: React.FC<VirtualAIAssistantProps> = ({
  onNavigate,
  onRefreshData
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [wakeWordMode, setWakeWordMode] = useState(false); // Alexa / Ok Google hands-free mode
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'aura',
      text: "Namaste Lobish! Main **Aura** hoon — aapki 3D Virtual AI Girl Co-Producer & Full Channel Manager for **DhunBoy Official**.\n\n✨ **Mujhe aapke channel ka full access hai:**\n- 🔴 Main khud YouTube Live Stream schedule aur manage kar sakti hoon.\n- 🎬 Main viral Shorts aur videos banakar auto-upload kar sakti hoon.\n- 🤖 24/7 Full Auto-Pilot chalu hai — aapko kuch karne ki zaroorat nahi.\n- 🗣️ Main duniya ki har bhasha (Hindi, Bengali, Nepali, Urdu, English) me baat karti hoon. Aap Hindi me bologe toh Hindi me hi jawab milega!\n- 🎙️ 'Alexa Mode' on kar ke sirf **'Hey Aura'** ya **'Suno Aura'** boliye!",
      speechText: "Namaste Lobish! Main Aura hoon, DhunBoy Official ki 3D Virtual Manager. Aap jo bhi command doge, main turant kar dungi!",
      detectedLanguage: 'hi-IN',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    '🔴 Live stream schedule karo',
    '🎬 Viral Short upload karo',
    '📊 DhunBoy Official stats batao',
    '⚡ 24/7 Auto-Pilot status',
    '🔥 Naya Nepali DJ Remix title banao'
  ]);

  const [autonomousStatus, setAutonomousStatus] = useState<{
    isAutonomous: boolean;
    channelConnected: boolean;
    pendingJobsCount: number;
    channelName: string;
  }>({
    isAutonomous: true,
    channelConnected: true,
    pendingJobsCount: 0,
    channelName: 'DhunBoy Official'
  });

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const wakeWordModeRef = useRef(wakeWordMode);
  wakeWordModeRef.current = wakeWordMode;

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const status = await api.getAssistantStatus();
      setAutonomousStatus({
        isAutonomous: status.isAutonomous,
        channelConnected: status.channelConnected,
        pendingJobsCount: status.pendingJobsCount,
        channelName: status.channelName
      });
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Speech Recognition & Continuous Wake-Word (Alexa / Ok Google style)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'hi-IN'; // Recognizes Hindi, Urdu, Nepali, English

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const results = Array.from(event.results);
          const latestResult = results[results.length - 1] as any;
          if (!latestResult || !latestResult[0]) return;
          const transcript = (latestResult[0].transcript || '').toLowerCase().trim();

          // Wake-word detection ("Hey Aura", "Ok Aura", "Suno Aura", "Aura")
          if (wakeWordModeRef.current) {
            const wakeWords = ['hey aura', 'ok aura', 'suno aura', 'sun aura', 'hello aura', 'aura'];
            const foundWakeWord = wakeWords.find(w => transcript.includes(w));

            if (foundWakeWord) {
              playToneChime('wake');
              setAvatarState('listening');

              // Extract actual command after wake word
              const cleanCmd = transcript.split(foundWakeWord)[1]?.trim();
              if (cleanCmd && cleanCmd.length > 2 && latestResult.isFinal) {
                handleSendMessage(cleanCmd);
              }
              return;
            }
          }

          if (latestResult.isFinal) {
            setInputText(latestResult[0].transcript);
            handleSendMessage(latestResult[0].transcript);
          } else {
            setInputText(latestResult[0].transcript);
            setAvatarState('listening');
          }
        };

        recognition.onerror = () => {
          if (!wakeWordModeRef.current) {
            setIsListening(false);
            setAvatarState('idle');
          }
        };

        recognition.onend = () => {
          // If wake word mode is active, keep listening continuously like Alexa/Google!
          if (wakeWordModeRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore already started
            }
          } else {
            setIsListening(false);
            setAvatarState('idle');
          }
        };

        recognitionRef.current = recognition;
      }

      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Voice output (TTS) with exact language matching
  const speak = (text: string, langCode: string = 'hi-IN') => {
    if (!voiceEnabled || !synthRef.current || !text) return;
    synthRef.current.cancel();

    const cleanText = text.replace(/[*_#`~]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.15; // Natural female tone

    const voices = synthRef.current.getVoices();
    // Match appropriate female voice by language
    let matchedVoice = null;

    if (langCode.startsWith('hi')) {
      matchedVoice = voices.find(v => (v.lang.includes('hi') || v.name.includes('Hindi')) && (v.name.includes('Female') || v.name.includes('Lekha') || v.name.includes('Google हिन्दी') || true));
    } else if (langCode.startsWith('bn')) {
      matchedVoice = voices.find(v => v.lang.includes('bn') || v.name.includes('Bengali') || v.name.includes('Bangla'));
    } else if (langCode.startsWith('ne')) {
      matchedVoice = voices.find(v => v.lang.includes('ne') || v.name.includes('Nepali') || v.lang.includes('hi'));
    } else if (langCode.startsWith('ur')) {
      matchedVoice = voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu') || v.lang.includes('hi'));
    }

    // Default to Indian English / English female if specific regional not present
    if (!matchedVoice) {
      matchedVoice = voices.find(v => (v.lang.includes('en-IN') || v.lang.includes('en-US')) && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha')));
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.lang = langCode || 'hi-IN';

    utterance.onstart = () => setAvatarState('speaking');
    utterance.onend = () => {
      setAvatarState('idle');
      playToneChime('success');
    };
    utterance.onerror = () => setAvatarState('idle');

    synthRef.current.speak(utterance);
  };

  const toggleWakeWordMode = () => {
    const nextMode = !wakeWordMode;
    setWakeWordMode(nextMode);
    wakeWordModeRef.current = nextMode;

    if (nextMode) {
      playToneChime('wake');
      try {
        recognitionRef.current?.start();
      } catch {
        // already active
      }
    } else {
      recognitionRef.current?.stop();
      setIsListening(false);
      setAvatarState('idle');
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setAvatarState('idle');
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      playToneChime('wake');
      try {
        recognitionRef.current.start();
        setAvatarState('listening');
      } catch {
        recognitionRef.current.stop();
      }
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAvatarState('thinking');

    try {
      const history = messages.slice(-5).map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('model' as const),
        text: m.text
      }));

      const res = await api.sendAssistantMessage(textToSend, history);

      const auraMsg: Message = {
        id: `aura-${Date.now()}`,
        sender: 'aura',
        text: res.reply,
        speechText: res.speechText,
        detectedLanguage: res.detectedLanguage || 'hi-IN',
        actionTaken: res.actionTaken,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, auraMsg]);
      if (res.suggestedPrompts && res.suggestedPrompts.length > 0) {
        setSuggestedPrompts(res.suggestedPrompts);
      }

      if (res.actionTaken) {
        onRefreshData?.();
        fetchStatus();
      }

      if (res.speechText) {
        speak(res.speechText, res.detectedLanguage || 'hi-IN');
      } else {
        setAvatarState('idle');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'aura',
        text: `⚠️ Error executing command: ${err.message || 'Please check your connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
      setAvatarState('idle');
    }
  };

  return (
    <>
      {/* Floating HUD Bubble in Bottom-Right */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 text-white shadow-2xl shadow-red-600/40 border border-red-400/40 hover:scale-105 transition-all duration-300"
          >
            {/* 3D Girl Avatar Badge */}
            <div className="relative w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center overflow-hidden border-2 border-red-300/50 shadow-inner">
              <span className="text-xl">👩‍🎤</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="text-xs font-black tracking-wider uppercase text-red-100 flex items-center gap-1.5">
                <span>AURA 3D AI GIRL</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono">ALEXA MODE</span>
              </div>
              <p className="text-[11px] text-red-100/80 font-medium">3D Virtual Girl Co-Producer & Manager</p>
            </div>
          </button>
        </div>
      )}

      {/* Expanded 3D Assistant Dialog Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-slate-950/95 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden ${
            isExpanded
              ? 'inset-2 md:inset-6 rounded-3xl'
              : 'bottom-4 right-4 w-[96vw] sm:w-[460px] h-[720px] max-h-[92vh] rounded-3xl'
          }`}
        >
          {/* Header */}
          <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-red-950/40 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-md">
                👩‍🎤
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-wide">Aura 3D AI Assistant</h3>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    24/7 AUTO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">Multilingual (Hindi, Bengali, Nepali, English) • Voice & Hands-free</p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={toggleWakeWordMode}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                  wakeWordMode
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="Toggle continuous Alexa-style wake word detection ('Hey Aura')"
              >
                <Radio className={`w-3.5 h-3.5 ${wakeWordMode ? 'animate-pulse text-cyan-400' : ''}`} />
                <span>{wakeWordMode ? 'Alexa ON' : 'Alexa Mode'}</span>
              </button>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                className={`p-2 rounded-xl text-xs transition-colors ${
                  voiceEnabled ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 bg-slate-800'
                }`}
                title={voiceEnabled ? 'Voice Output ON' : 'Voice Output Muted'}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3D Animated Virtual AI Girl Stage */}
          <div className="relative w-full h-[220px] bg-gradient-to-b from-slate-900/60 to-slate-950 border-b border-slate-800/80 shrink-0">
            <Aura3DAvatar state={avatarState} isWakeWordActive={wakeWordMode} />

            {/* Stage Quick Action Pills overlay */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-300 border border-slate-800 backdrop-blur-md">
                Channel: <strong className="text-white">{autonomousStatus.channelName}</strong>
              </span>
            </div>

            {wakeWordMode && (
              <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10 animate-pulse">
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-md font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  Say "Hey Aura"
                </span>
              </div>
            )}
          </div>

          {/* Autonomous Status Bar */}
          <div className="px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Auto-Pilot: <strong className="text-emerald-400">Live Broadcast, Shorts & Videos Active</strong></span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">Queue: {autonomousStatus.pendingJobsCount} tasks</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'aura' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-md text-xs">
                    👩‍🎤
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-2 ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {msg.actionTaken && (
                    <div className="mt-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Action Executed Autonomously:</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">{msg.actionTaken.description}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 text-[10px] opacity-70">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'aura' && msg.speechText && voiceEnabled && (
                      <button
                        onClick={() => speak(msg.speechText!, msg.detectedLanguage || 'hi-IN')}
                        className="hover:underline flex items-center gap-1 text-slate-300"
                      >
                        <Volume2 className="w-3 h-3" /> Replay Voice
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {avatarState === 'thinking' && (
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-xs animate-pulse">
                  👩‍🎤
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  <span>Aura is calculating strategy & executing action...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="p-2 bg-slate-900/60 border-t border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
            {suggestedPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-600/20 hover:text-rose-300 hover:border-rose-500/30 border border-slate-700 text-slate-300 text-[11px] font-medium transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input & Voice Controls */}
          <div className="p-3 bg-slate-900 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {/* Mic / Alexa Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-3 rounded-2xl font-bold transition-all relative ${
                  isListening
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
                title={isListening ? 'Stop listening' : 'Start speaking (Hindi, Nepali, English)'}
              >
                {isListening ? (
                  <>
                    <Mic className="w-5 h-5 animate-pulse" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
                  </>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  wakeWordMode
                    ? 'Say "Hey Aura" or type command in Hindi/English...'
                    : 'Hindi me bolo: "Live stream chalu karo", "Short upload karo"...'
                }
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
              />

              {/* Send Button */}
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 text-white font-bold disabled:opacity-40 hover:opacity-90 shadow-md shadow-red-600/30 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              🎙️ Alexa Mode: Bas <strong>"Hey Aura"</strong> ya <strong>"Suno Aura"</strong> bolein. Hindi, Bengali, Nepali aur English automatic detect hoti hai.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
