import React, { useState, useMemo } from 'react';
import MapCard from './MapCard';
import { calculateMapsIntel } from '../../engine/mapsAnalytics';
import { THEME_CLASSES } from '../../config/theme';
import { Compass, Flame, Target, Shield, Filter } from 'lucide-react';

export default function MapsTab({ matches = [] }) {
  const [selectedMode, setSelectedMode] = useState('ALL');

  const mapsIntel = useMemo(() => calculateMapsIntel(matches), [matches]);

  // Mode categories
  const modeStats = useMemo(() => {
    const stats = {
      'HARDPOINT': { wins: 0, losses: 0, total: 0 },
      'SEARCH & DESTROY': { wins: 0, losses: 0, total: 0 },
      'CONTROL': { wins: 0, losses: 0, total: 0 }
    };

    matches.forEach(m => {
      const mode = (m.mode || '').toUpperCase();
      let target = null;
      if (mode.includes('HARDPOINT')) target = stats['HARDPOINT'];
      else if (mode.includes('SEARCH') || mode.includes('S&D')) target = stats['SEARCH & DESTROY'];
      else if (mode.includes('CONTROL')) target = stats['CONTROL'];

      if (target) {
        target.total++;
        if (m.result === 'W') target.wins++;
        else target.losses++;
      }
    });

    return stats;
  }, [matches]);

  // Group maps by mode
  const hardpointMaps = useMemo(() => mapsIntel.filter(m => m.mode.includes('HARDPOINT')), [mapsIntel]);
  const sndMaps = useMemo(() => mapsIntel.filter(m => m.mode.includes('SEARCH') || m.mode.includes('S&D')), [mapsIntel]);
  const controlMaps = useMemo(() => mapsIntel.filter(m => m.mode.includes('CONTROL')), [mapsIntel]);

  const modeFilterPills = [
    { id: 'ALL', label: 'ALL MODES', count: mapsIntel.length },
    { id: 'HARDPOINT', label: 'HARDPOINT', count: hardpointMaps.length },
    { id: 'SEARCH & DESTROY', label: 'S&D', count: sndMaps.length },
    { id: 'CONTROL', label: 'CONTROL', count: controlMaps.length }
  ];

  return (
    <div className="space-y-6 mb-10 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#223046] pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wider m-0 flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-primary inline-block shadow-[0_0_8px_rgba(245,183,0,0.6)]"></span>
            MAP POOLS & SQUAD INTEL
            <span className="text-xs font-mono-num font-normal text-[#7d90a6] bg-[#111723] px-2 py-0.5 rounded border border-[#223046]">
              {mapsIntel.length} MAPS RECORDED
            </span>
          </h2>
          <p className="text-xs font-mono-num text-[#7d90a6] m-0 mt-1">
            Mode-specific map performance analytics and algorithmically recommended starting 5 lineups.
          </p>
        </div>

        {/* Mode Filter Selector */}
        <div className="flex items-center gap-1.5 bg-[#080c14] border border-[#223046] p-1 rounded-sm">
          {modeFilterPills.map(pill => {
            const isActive = selectedMode === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedMode(pill.id)}
                className={`px-3 py-1 text-xs font-display transition-all cursor-pointer rounded-xs flex items-center gap-1.5 ${
                  isActive
                    ? THEME_CLASSES.btnPrimary
                    : 'text-[#7d90a6] hover:text-white'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`text-[10px] font-mono-num ${isActive ? 'text-[#080c14]/80' : 'text-[#5a6b82]'}`}>
                  ({pill.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Hardpoint Summary */}
        <div className="bg-[#111723] border border-[#223046] p-3.5 clip-corner-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center text-[#f59e0b]">
              <Flame size={16} />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm block tracking-wide">
                HARDPOINT POOL
              </span>
              <span className="text-[11px] font-mono-num text-[#7d90a6]">
                {hardpointMaps.length} Active Maps
              </span>
            </div>
          </div>
          <div className="text-right font-mono-num text-xs">
            <span className="text-[#f59e0b] font-bold text-base block">
              {modeStats['HARDPOINT'].total > 0
                ? `${Math.round((modeStats['HARDPOINT'].wins / modeStats['HARDPOINT'].total) * 100)}%`
                : '0%'}
            </span>
            <span className="text-[#7d90a6] text-[10px]">
              {modeStats['HARDPOINT'].wins}W - {modeStats['HARDPOINT'].losses}L
            </span>
          </div>
        </div>

        {/* Search & Destroy Summary */}
        <div className="bg-[#111723] border border-[#223046] p-3.5 clip-corner-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#f5b700]/10 border border-[#f5b700]/30 flex items-center justify-center text-[#f5b700]">
              <Target size={16} />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm block tracking-wide">
                SEARCH & DESTROY
              </span>
              <span className="text-[11px] font-mono-num text-[#7d90a6]">
                {sndMaps.length} Active Maps
              </span>
            </div>
          </div>
          <div className="text-right font-mono-num text-xs">
            <span className="text-[#ffd700] font-bold text-base block">
              {modeStats['SEARCH & DESTROY'].total > 0
                ? `${Math.round((modeStats['SEARCH & DESTROY'].wins / modeStats['SEARCH & DESTROY'].total) * 100)}%`
                : '0%'}
            </span>
            <span className="text-[#7d90a6] text-[10px]">
              {modeStats['SEARCH & DESTROY'].wins}W - {modeStats['SEARCH & DESTROY'].losses}L
            </span>
          </div>
        </div>

        {/* Control Summary */}
        <div className="bg-[#111723] border border-[#223046] p-3.5 clip-corner-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#10b981]/10 border border-[#10b981]/30 flex items-center justify-center text-[#10b981]">
              <Shield size={16} />
            </div>
            <div>
              <span className="font-display font-bold text-white text-sm block tracking-wide">
                CONTROL POOL
              </span>
              <span className="text-[11px] font-mono-num text-[#7d90a6]">
                {controlMaps.length} Active Maps
              </span>
            </div>
          </div>
          <div className="text-right font-mono-num text-xs">
            <span className="text-[#10b981] font-bold text-base block">
              {modeStats['CONTROL'].total > 0
                ? `${Math.round((modeStats['CONTROL'].wins / modeStats['CONTROL'].total) * 100)}%`
                : '0%'}
            </span>
            <span className="text-[#7d90a6] text-[10px]">
              {modeStats['CONTROL'].wins}W - {modeStats['CONTROL'].losses}L
            </span>
          </div>
        </div>
      </div>

      {/* MAP LISTINGS BY MODE */}
      <div className="space-y-8">
        
        {/* HARDPOINT SECTION */}
        {(selectedMode === 'ALL' || selectedMode === 'HARDPOINT') && hardpointMaps.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-[#f59e0b]" />
              <h3 className="font-display font-extrabold text-lg text-white tracking-wider m-0">
                HARDPOINT MAP ROTATION ({hardpointMaps.length})
              </h3>
            </div>
            <div className="space-y-3">
              {hardpointMaps.map(m => (
                <MapCard key={`${m.mode}-${m.map}`} mapData={m} />
              ))}
            </div>
          </section>
        )}

        {/* SEARCH & DESTROY SECTION */}
        {(selectedMode === 'ALL' || selectedMode === 'SEARCH & DESTROY') && sndMaps.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#f5b700]" />
              <h3 className="font-display font-extrabold text-lg text-white tracking-wider m-0">
                SEARCH & DESTROY MAP ROTATION ({sndMaps.length})
              </h3>
            </div>
            <div className="space-y-3">
              {sndMaps.map(m => (
                <MapCard key={`${m.mode}-${m.map}`} mapData={m} />
              ))}
            </div>
          </section>
        )}

        {/* CONTROL SECTION */}
        {(selectedMode === 'ALL' || selectedMode === 'CONTROL') && controlMaps.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-[#10b981]" />
              <h3 className="font-display font-extrabold text-lg text-white tracking-wider m-0">
                CONTROL MAP ROTATION ({controlMaps.length})
              </h3>
            </div>
            <div className="space-y-3">
              {controlMaps.map(m => (
                <MapCard key={`${m.mode}-${m.map}`} mapData={m} />
              ))}
            </div>
          </section>
        )}

      </div>

    </div>
  );
}
