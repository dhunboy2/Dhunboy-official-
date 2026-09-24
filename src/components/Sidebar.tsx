import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  UploadCloud,
  Video,
  Smartphone,
  Radio,
  Search,
  BarChart3,
  CalendarDays,
  ListMusic,
  Clock,
  Bot,
  History,
  Gauge,
  Settings,
  X
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  mobileOpen,
  onCloseMobile
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'yt_studio_pro', label: 'AI YouTube Studio Pro', icon: Video, badge: 'PRO' },
    { id: 'ai_studio', label: 'AI Video Studio', icon: Sparkles, badge: 'Auto' },
    { id: 'videos', label: 'Content Catalog', icon: Video, badge: null },
    { id: 'upload', label: 'Upload Center', icon: UploadCloud, badge: 'AI' },
    { id: 'shorts', label: 'Shorts Studio', icon: Smartphone, badge: '9:16' },
    { id: 'live', label: 'Live Center & RTMP', icon: Radio, badge: 'Live' },
    { id: 'seo', label: 'SEO Lab', icon: Search, badge: 'Score' },
    { id: 'analytics', label: 'Analytics Agent', icon: BarChart3, badge: null },
    { id: 'planner', label: 'Content Planner', icon: CalendarDays, badge: 'New' },
    { id: 'playlists', label: 'Playlists', icon: ListMusic, badge: null },
    { id: 'scheduler', label: 'Scheduler', icon: Clock, badge: null },
    { id: 'automation', label: 'AI Manager', icon: Bot, badge: 'Autonomous' },
    { id: 'activity', label: 'Activity Logs', icon: History, badge: null },
    { id: 'quota', label: 'API Quota', icon: Gauge, badge: null },
    { id: 'settings', label: 'Settings & OAuth', icon: Settings, badge: null }
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 w-64 select-none">
      {/* Mobile close button */}
      <div className="lg:hidden p-4 flex items-center justify-between border-b border-slate-800">
        <span className="font-bold text-slate-200 text-sm">Navigation</span>
        <button
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-1.5">
          Management & Media
        </div>
        {navItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  isActive ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 pt-3 pb-1">
          Intelligence & Growth
        </div>
        {navItems.slice(5, 11).map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  isActive ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 pt-3 pb-1">
          System & Settings
        </div>
        {navItems.slice(11).map(item => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  isActive ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Channel Footnote */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500">
        <div className="flex items-center justify-between">
          <span>Dhunboy Engine v3.8</span>
          <span className="text-emerald-500 font-mono">ONLINE</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block h-[calc(100vh-4rem)] sticky top-16 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
