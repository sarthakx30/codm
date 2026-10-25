import React from 'react';
import { LayoutDashboard, Compass, Swords, Users, PlusCircle } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Home', icon: LayoutDashboard },
  { id: 'maps', label: 'Maps', icon: Compass },
  { id: 'matches', label: 'Matches', icon: Swords },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'add', label: 'Add', icon: PlusCircle }
];

export default function MobileNav({ activeTab, onTabChange }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none animate-nav-up"
    >
      <div className="mx-auto w-full max-w-md px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[#2a3a52] bg-[#0c111a]/95 p-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 py-2 transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'bg-[#f5b700] text-[#080c14] shadow-[0_0_18px_rgba(245,183,0,0.35)]'
                    : 'text-[#8292a8] hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-display text-[10px] font-semibold tracking-wider leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
