import React from 'react';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed left-1/2 bottom-20 -translate-x-1/2 bg-[#ffb800] text-[#0b0e14] px-5 py-2 font-display text-base font-bold shadow-[0_0_15px_rgba(255,184,0,0.5)] z-50 clip-badge animate-bounce">
      {message}
    </div>
  );
}
