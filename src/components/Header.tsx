import React, { useState } from 'react';
import {
  Youtube,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { YouTubeChannel, AppNotification, AutomationMode } from '../types';

interface HeaderProps {
  channel: YouTubeChannel | null;
  isConnected: boolean;
  hasGeminiKey: boolean;
  quotaUsed: number;
  quotaLimit: number;
  automationMode: AutomationMode;
  notifications: AppNotification[];
  onNotificationClick: (notif: AppNotification) => void;
  onMarkAllRead: () => void;
  onOpenMobileMenu: () => void;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  channel,
  isConnected,
  hasGeminiKey,
  quotaUsed,
  quotaLimit,
  automationMode,
  notifications,
  onNotificationClick,
  onMarkAllRead,
  onOpenMobileMenu,
  onNavigate
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20 text-white font-black text-lg tracking-tighter">
            DB
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-sm md:text-base tracking-tight leading-none">
                Dhunboy AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                YT Manager
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="text-slate-300 font-medium">Dhunboy Official</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Lobish Sarma</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle/Right: Status Badges & Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* YouTube Connection Status */}
        {isConnected ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>YouTube Connected</span>
          </div>
        ) : (
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connect Channel</span>
            <span className="sm:hidden">OAuth Setup</span>
          </button>
        )}

        {/* AI Engine Status */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Gemini 3.8 Flash</span>
        </div>

        {/* Automation Mode Badge */}
        <button
          onClick={() => onNavigate('automation')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-200 hover:border-slate-600 transition-colors"
          title="Click to configure Automation permissions"
        >
          <span className="text-slate-400 text-[11px] hidden sm:inline">Mode:</span>
          <span className={`capitalize font-semibold ${
            automationMode === 'autonomous'
              ? 'text-emerald-400'
              : automationMode === 'assisted'
              ? 'text-cyan-400'
              : 'text-amber-400'
          }`}>
            {automationMode}
          </span>
        </button>

        {/* Quota Badge */}
        <button
          onClick={() => onNavigate('quota')}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300 hover:border-slate-600 transition-colors"
          title="Daily YouTube Data API Quota Usage"
        >
          <Radio className="w-3 h-3 text-red-400" />
          <span>Quota:</span>
          <span className="font-mono text-slate-200">
            {quotaUsed.toLocaleString()} / {quotaLimit.toLocaleString()}
          </span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-200">Activity & Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[11px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs text-red-400 hover:text-red-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No recent notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        onNotificationClick(n);
                        if (n.link) onNavigate(n.link.replace('/', ''));
                        setShowNotifications(false);
                      }}
                      className={`p-3 text-xs cursor-pointer transition-colors hover:bg-slate-800/60 ${
                        !n.read ? 'bg-slate-850/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                          {n.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                          {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          {n.type === 'info' && <Sparkles className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200">{n.title}</p>
                          <p className="text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
