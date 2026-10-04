import React from 'react';
import { LayoutDashboard, Users, Swords, PlusCircle } from 'lucide-react';

export default function Navbar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    { id: 'players', label: 'PLAYERS', icon: Users },
    { id: 'matches', label: 'MATCHES', icon: Swords },
    { id: 'add', label: 'ADD MATCH', icon: PlusCircle }
  ];

  return (
    <nav className="fixed left-0 right-0 bottom-0 grid grid-cols-4 bg-[#0c111a]/95 backdrop-blur-md border-t border-[#354b6d] z-50 pb-[env(safe-area-inset-bottom,0)] max-w-2xl mx-auto shadow-2xl">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center py-2.5 transition-all relative ${
              isActive ? 'text-white font-bold' : 'text-[#7d90a6] hover:text-[#f0f4f8]'
            }`}
          >
            {isActive && (
              <span className="absolute top-0 left-0 right-0 h-[2px] bg-[#ffb800] shadow-[0_0_8px_rgba(255,184,0,0.6)]" />
            )}
            <Icon size={18} className={isActive ? 'text-[#ffb800]' : ''} />
            <span className="text-[12px] font-display tracking-wider mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
