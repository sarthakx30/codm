import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Swords,
  Users,
  PlusCircle,
  Tag,
  Shield,
  Activity,
  X,
  ChevronRight
} from 'lucide-react';
import { APP_VERSION } from '../../config/version';

export default function Sidebar({
  activeTab,
  onTabChange,
  isMobileOpen,
  onMobileClose,
  isWaking,
  wakingMsg,
  matchCount = 0,
  onOpenAliasModal
}) {
  const navItems = [
    { id: 'overview', label: 'OVERVIEW', subtitle: 'Tactical Intel & Records', icon: LayoutDashboard },
    { id: 'maps', label: 'MAPS', subtitle: 'Mode Pools & Optimal Squads', icon: Compass, badge: 'NEW' },
    { id: 'matches', label: 'MATCHES', subtitle: 'History & Scrim Reports', icon: Swords },
    { id: 'players', label: 'PLAYERS', subtitle: 'Roster & Efficiency (MER)', icon: Users },
    { id: 'add', label: 'ADD MATCH', subtitle: 'Gemini Screenshot OCR', icon: PlusCircle }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#223046] bg-[#080c14]/70">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#ffb800]/10 border border-[#ffb800]/40 flex items-center justify-center text-[#ffb800] shadow-[0_0_12px_rgba(255,184,0,0.25)]">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-white text-lg tracking-wider m-0 leading-none">
                  HORIZON
                </h1>
                <span className="text-[10px] font-mono-num text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/30 px-1.5 py-0.2 rounded-xs font-bold">
                  {APP_VERSION}
                </span>
              </div>
              <span className="text-[10px] font-mono-num text-[#7d90a6] tracking-widest block mt-0.5">
                TACTICAL ANALYTICS
              </span>
            </div>
          </div>
          {/* Close button on mobile */}
          {isMobileOpen && (
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1.5 text-[#7d90a6] hover:text-white hover:bg-[#161e2e] rounded transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Database status chip */}
        <div className="mt-3.5 flex items-center justify-between bg-[#111723] border border-[#223046] px-2.5 py-1 rounded text-[11px] font-mono-num">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isWaking ? 'bg-[#ffb800] animate-ping' : 'bg-[#10b981]'}`} />
            <span className="text-[#a0aec0]">{isWaking ? 'WAKING...' : 'SYSTEM // ONLINE'}</span>
          </div>
          <span className="text-[#ffb800] font-bold">{matchCount} MATCHES</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 py-1.5 text-[10px] font-mono-num uppercase tracking-widest text-[#7d90a6]">
          Command Deck
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onMobileClose) onMobileClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm transition-all group cursor-pointer text-left ${
                isActive
                  ? 'bg-gradient-to-r from-[#00e5ff]/15 to-transparent border-l-4 border-l-[#00e5ff] text-white font-bold'
                  : 'text-[#7d90a6] hover:text-white hover:bg-[#111723]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  className={`transition-colors ${
                    isActive ? 'text-[#00e5ff]' : 'text-[#7d90a6] group-hover:text-white'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display tracking-wider text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="bg-[#ffb800] text-black text-[9px] font-bold px-1.5 py-0.2 rounded-xs font-mono-num">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono-num text-[#5a6b82] block">
                    {item.subtitle}
                  </span>
                </div>
              </div>
              <ChevronRight
                size={14}
                className={`transition-transform ${
                  isActive ? 'text-[#00e5ff] translate-x-0.5' : 'text-transparent group-hover:text-[#7d90a6]'
                }`}
              />
            </button>
          );
        })}

        {/* Tactical Quick Actions */}
        {onOpenAliasModal && (
          <div className="pt-4 px-3 space-y-2">
            <div className="text-[10px] font-mono-num uppercase tracking-widest text-[#7d90a6] mb-1.5">
              Tactical Operations
            </div>

            <button
              onClick={() => {
                onOpenAliasModal();
                if (onMobileClose) onMobileClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#111723] hover:bg-[#161e2e] border border-[#354b6d] hover:border-[#ffb800] text-xs font-display text-[#ffb800] rounded-sm transition-all cursor-pointer shadow-[0_0_10px_rgba(255,184,0,0.1)] group"
            >
              <div className="flex items-center gap-2">
                <Tag size={14} />
                <span>ROSTER & ALIASES</span>
              </div>
              <ChevronRight size={12} className="text-[#ffb800]/60 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-[#223046] bg-[#080c14]/80 text-[10px] font-mono-num text-[#5a6b82]">
        <div className="flex items-center justify-between">
          <span>CODM ANALYTICS // {APP_VERSION}</span>
          <span className="text-[#00e5ff]">READY</span>
        </div>
        {wakingMsg && (
          <div className="mt-1 text-[#ffb800] animate-pulse">
            {wakingMsg}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed top-0 bottom-0 left-0 w-64 xl:w-72 bg-[#0c111a]/98 backdrop-blur-xl border-r border-[#223046] z-40 flex-col shadow-2xl">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Out Drawer & Backdrop */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-fadeIn"
            onClick={onMobileClose}
          />
          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-[#0c111a] border-r border-[#223046] h-full shadow-[0_0_50px_rgba(0,0,0,0.9)] animate-slideRight z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
