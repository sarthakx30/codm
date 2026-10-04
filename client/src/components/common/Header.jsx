import React from 'react';
import { RefreshCw, Radio, AlertOctagon } from 'lucide-react';

export default function Header({ filter, onFilterChange, isWaking, wakingMsg, onRefresh, loading, serverError }) {
  return (
    <header className="mb-6 border-b border-[#223046] pb-4">
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between text-[11px] tracking-wider text-[#7d90a6] font-mono-num mb-2">
        <div className="flex items-center gap-2">
          {serverError ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-[#ff334b] animate-ping"></span>
              <span className="text-[#ff334b] font-bold">OFFLINE</span>
            </>
          ) : (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse"></span>
              <span>CALL OF DUTY: MOBILE</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={serverError ? 'text-[#ff334b]' : 'text-[#00e5ff]'}>
            {serverError ? 'API OFFLINE' : 'V2.0 // CLOUD'}
          </span>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#223046] hover:border-[#00e5ff] hover:text-[#00e5ff] transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh Match Data"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin text-[#00e5ff]' : ''} />
            <span>SYNC</span>
          </button>
        </div>
      </div>

      {/* Main Title & Gradient Accent */}
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <div className="flex items-baseline gap-3">
          <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-wider text-white drop-shadow-[0_0_15px_rgba(0,229,255,0.35)]">
            HORIZON
          </h1>
          {serverError && (
            <span className="inline-flex items-center gap-1 text-xs font-mono-num text-[#ff334b] bg-[#ff334b]/15 border border-[#ff334b] px-2 py-0.5 tracking-wider font-bold animate-pulse clip-corner-sm">
              <AlertOctagon size={12} />
              // SERVER UNREACHABLE
            </span>
          )}
        </div>
        {!serverError && (
          <span className="text-xs font-mono-num text-[#7d90a6] tracking-widest hidden sm:inline">
            // COMPETITIVE ANALYTICS PLATFORM
          </span>
        )}
      </div>
      <div className="h-[2px] mt-2 bg-gradient-to-r from-[#00e5ff] via-[#ffb800] via-45% to-[#ff334b] to-85% rounded-full"></div>

      {/* Render Cold-Start Waking Alert */}
      {isWaking && (
        <div className="mt-3 px-3 py-2 bg-[#ffb800]/10 border border-[#ffb800] text-[#ffb800] font-mono-num text-xs flex items-center gap-2 rounded clip-corner-sm animate-pulse">
          <Radio size={14} className="animate-spin" />
          <span>{wakingMsg || '// WAKING SERVER (EST. 30S)...'}</span>
        </div>
      )}

      {/* Filter Scope Bar */}
      <div className="mt-4 flex items-center justify-between bg-[#111723] border border-[#223046] px-3.5 py-2 clip-corner-sm">
        <span className="text-xs font-display text-[#7d90a6] tracking-wider">MATCH SCOPE</span>
        <div className="flex gap-1.5">
          {[
            { id: '', label: 'ALL MATCHES' },
            { id: 'scrim', label: 'SCRIMS' },
            { id: 'tournament', label: 'TOURNAMENTS' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => onFilterChange(opt.id)}
              className={`px-3 py-1 text-xs font-display transition-all ${
                filter === opt.id
                  ? 'bg-[#161e2e] text-[#ffb800] border border-[#ffb800] shadow-[0_0_8px_rgba(255,184,0,0.25)]'
                  : 'text-[#7d90a6] hover:text-white border border-transparent'
              } clip-corner-sm`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
