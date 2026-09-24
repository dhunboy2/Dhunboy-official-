import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { UploadCenter } from './pages/UploadCenter';
import { ShortsStudio } from './pages/ShortsStudio';
import { LiveCenter } from './pages/LiveCenter';
import { VideoCatalog } from './pages/VideoCatalog';
import { AiVideoStudio } from './pages/AiVideoStudio';
import { YouTubeStudioPro } from './pages/YouTubeStudioPro';
import { ContentPlanner } from './pages/ContentPlanner';
import { PlaylistManager } from './pages/PlaylistManager';
import { SeoLab } from './pages/SeoLab';
import { AnalyticsAgent } from './pages/AnalyticsAgent';
import { AutomationManager } from './pages/AutomationManager';
import { Scheduler } from './pages/Scheduler';
import { ActivityCenter } from './pages/ActivityCenter';
import { QuotaTracker } from './pages/QuotaTracker';
import { Settings } from './pages/Settings';
import { VirtualAIAssistant } from './components/VirtualAIAssistant';
import { api } from './api';
import { YouTubeChannel, AppNotification, AutomationMode } from './types';
import {
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [channel, setChannel] = useState<YouTubeChannel | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [quotaUsed, setQuotaUsed] = useState<number>(140);
  const [quotaLimit, setQuotaLimit] = useState<number>(10000);
  const [automationMode, setAutomationMode] = useState<AutomationMode>('assisted');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [authBanner, setAuthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchAppData = useCallback(async () => {
    try {
      const [authRes, channelRes, quotaRes, notifRes, autoRes] = await Promise.allSettled([
        api.getAuthStatus(),
        api.getChannelInfo(),
        api.getQuota(),
        api.getNotifications(),
        api.getAutomationSettings()
      ]);

      if (authRes.status === 'fulfilled') {
        setIsConnected(authRes.value.connected);
        setHasGeminiKey(authRes.value.hasGeminiKey);
        if (authRes.value.connected && authRes.value.channel) {
          setChannel(authRes.value.channel);
        } else {
          setChannel(null);
        }
      }

      if (channelRes.status === 'fulfilled' && authRes.status === 'fulfilled' && authRes.value.connected && channelRes.value.channel) {
        setChannel(channelRes.value.channel);
      }

      if (quotaRes.status === 'fulfilled') {
        setQuotaUsed(quotaRes.value.quota.usedToday);
        setQuotaLimit(quotaRes.value.quota.limit);
      }

      if (notifRes.status === 'fulfilled') {
        setNotifications(notifRes.value.notifications);
      }

      if (autoRes.status === 'fulfilled') {
        setAutomationMode(autoRes.value.mode);
      }
    } catch (err) {
      console.error('Error fetching global application data:', err);
    }
  }, []);

  useEffect(() => {
    fetchAppData();

    // Check URL parameters for OAuth redirect notifications
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth') === 'success') {
      setAuthBanner({
        type: 'success',
        message: 'YouTube Channel connected successfully! Tokens encrypted and verified.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error')) {
      setAuthBanner({
        type: 'error',
        message: decodeURIComponent(params.get('error') || 'Authentication failed.')
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchAppData]);

  const handleNotificationClick = async (notif: AppNotification) => {
    try {
      await api.markNotificationRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      if (notif.link) {
        setCurrentPage(notif.link);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} channel={channel} isConnected={isConnected} />;
      case 'yt_studio_pro':
        return <YouTubeStudioPro />;
      case 'ai_studio':
        return <AiVideoStudio channel={channel} isConnected={isConnected} onNavigate={setCurrentPage} />;
      case 'upload':
        return <UploadCenter />;
      case 'shorts':
        return <ShortsStudio />;
      case 'live':
        return <LiveCenter />;
      case 'catalog':
      case 'videos':
        return <VideoCatalog onNavigate={setCurrentPage} />;
      case 'planner':
        return <ContentPlanner />;
      case 'playlists':
        return <PlaylistManager />;
      case 'seo':
        return <SeoLab />;
      case 'analytics':
        return <AnalyticsAgent />;
      case 'automation':
        return <AutomationManager />;
      case 'scheduler':
        return <Scheduler onNavigate={setCurrentPage} />;
      case 'activity':
        return <ActivityCenter />;
      case 'quota':
        return <QuotaTracker />;
      case 'settings':
        return (
          <Settings
            channel={channel}
            isConnected={isConnected}
            onRefreshAuth={fetchAppData}
          />
        );
      default:
        return <Dashboard onNavigate={setCurrentPage} channel={channel} isConnected={isConnected} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      {/* Top Header */}
      <Header
        channel={channel}
        isConnected={isConnected}
        hasGeminiKey={hasGeminiKey}
        quotaUsed={quotaUsed}
        quotaLimit={quotaLimit}
        automationMode={automationMode}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllRead={handleMarkAllRead}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onNavigate={setCurrentPage}
      />

      {/* OAuth Banner Notification */}
      {authBanner && (
        <div className={`py-2.5 px-4 flex items-center justify-between text-xs font-semibold ${
          authBanner.type === 'success'
            ? 'bg-emerald-600/90 text-white'
            : 'bg-red-600/90 text-white'
        }`}>
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            {authBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{authBanner.message}</span>
            <button
              onClick={() => setAuthBanner(null)}
              className="ml-auto p-1 hover:bg-black/20 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main App Layout */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {renderPage()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 py-2 px-3 flex items-center justify-around z-40">
        {[
          { id: 'dashboard', label: 'Home' },
          { id: 'ai_studio', label: 'AI Video' },
          { id: 'videos', label: 'YT Studio' },
          { id: 'upload', label: 'Upload' },
          { id: 'settings', label: 'Settings' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
              currentPage === item.id || (item.id === 'videos' && currentPage === 'catalog')
                ? 'text-red-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {/* Animated Virtual AI Assistant (Voice + Text + Autonomous Engine) */}
      <VirtualAIAssistant
        onNavigate={setCurrentPage}
        onRefreshData={fetchAppData}
      />
    </div>
  );
}
