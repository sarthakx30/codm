import React, { useState, useMemo } from 'react';
import MapCard from './MapCard';
import { calculateMapsIntel } from '../../engine/mapsAnalytics';
import { parseTier } from '../../engine/playerAnalytics';
import { getModeId, MODES, TIER_FILTERS } from '../../config/matchOptions';
import FilterPills from '../common/FilterPills';
import { Flame, Target, Shield, X } from 'lucide-react';

const MODE_META = {
  hardpoint: {
    icon: Flame,
    color: '#f59e0b',
    poolTitle: 'HARDPOINT POOL',
    sectionTitle: 'HARDPOINT MAP ROTATION'
  },
  snd: {
    icon: Target,
    color: '#f5b700',
    poolTitle: 'SEARCH & DESTROY',
    sectionTitle: 'SEARCH & DESTROY MAP ROTATION'
  },
  control: {
    icon: Shield,
    color: '#10b981',
    poolTitle: 'CONTROL POOL',
    sectionTitle: 'CONTROL MAP ROTATION'
  }
};

export default function MapsTab({ matches = [] }) {
  const [selectedMode, setSelectedMode] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');

  // Tier filter counts
  const tierCounts = useMemo(() => {
    const counts = { ALL: matches.length, T1: 0, T2: 0, T3: 0 };
    matches.forEach(m => {
      const pt = parseTier(m.tier);
      if (pt.main && counts[pt.main] !== undefined) {
        counts[pt.main]++;
      }
    });
    return counts;
  }, [matches]);

  // Hide empty tiers unless the user already selected one.
  const tierOptions = useMemo(
    () =>
      TIER_FILTERS.map(option => ({
        ...option,
        count: option.value === 'ALL' ? matches.length : tierCounts[option.value]
      })).filter(
        option =>
          option.value === 'ALL' ||
          option.count > 0 ||
          selectedTier === option.value
      ),
    [matches.length, tierCounts, selectedTier]
  );

  const tierFilteredMatches = useMemo(() => {
    if (selectedTier === 'ALL') return matches;
    return matches.filter(m => parseTier(m.tier).main === selectedTier);
  }, [matches, selectedTier]);

  const mapsIntel = useMemo(
    () => calculateMapsIntel(tierFilteredMatches),
    [tierFilteredMatches]
  );

  // Win/loss totals for the three canonical modes.
  const modeStats = useMemo(() => {
    const stats = Object.fromEntries(
      MODES.map(mode => [mode.id, { wins: 0, losses: 0, total: 0 }])
    );

    tierFilteredMatches.forEach(m => {
      const modeId = getModeId(m.mode);
      if (!stats[modeId]) return;
      stats[modeId].total++;
      if (m.result === 'W') stats[modeId].wins++;
      else stats[modeId].losses++;
    });

    return stats;
  }, [tierFilteredMatches]);

  // Group map cards by canonical mode.
  const mapsByMode = useMemo(() => {
    const grouped = Object.fromEntries(MODES.map(mode => [mode.id, []]));
    mapsIntel.forEach(map => {
      const modeId = map.modeId || getModeId(map.mode);
      if (grouped[modeId]) grouped[modeId].push(map);
    });
    return grouped;
  }, [mapsIntel]);

  const visibleMaps =
    selectedMode === 'ALL' ? mapsIntel : mapsByMode[selectedMode] || [];

  const modeCards = MODES.map(mode => ({
    ...mode,
    ...MODE_META[mode.id],
    maps: mapsByMode[mode.id] || [],
    stats: modeStats[mode.id]
  }));

  return (
    <div className="space-y-6 mb-10 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#223046] pb-4">
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wider m-0 flex flex-wrap items-center gap-2.5">
            <span className="w-1.5 h-5 bg-primary inline-block shadow-[0_0_8px_rgba(245,183,0,0.6)]"></span>
            MAP POOLS & SQUAD INTEL
            <span className="text-xs font-mono-num font-normal text-[#7d90a6] bg-[#111723] px-2 py-0.5 rounded border border-[#223046]">
              {visibleMaps.length} MAPS IN VIEW
            </span>
          </h2>
          <p className="text-xs font-mono-num text-[#7d90a6] m-0 mt-1">
            Mode-normalized margin and tier-weighted performance analytics. Bad performances against lower tiers are penalized symmetrically.
          </p>
        </div>

        {/* Tier Filter + Clear Mode */}
        <div className="flex flex-col gap-2 w-full lg:w-auto">
          <FilterPills
            label="TIER"
            options={tierOptions}
            value={selectedTier}
            onChange={setSelectedTier}
            ariaLabel="Filter map pools by opponent tier"
            className="w-full"
          />
          {selectedMode !== 'ALL' && (
            <button
              type="button"
              onClick={() => setSelectedMode('ALL')}
              className="self-start inline-flex items-center gap-1 text-[10px] font-display tracking-wider text-[#f5b700] hover:text-[#ffd700] cursor-pointer"
            >
              <X size={12} />
              SHOW ALL MODES
            </button>
          )}
        </div>
      </div>

      {/* Mode Overview: cards also work as the mode filter */}
      <div>
        <div className="text-[10px] font-mono-num uppercase tracking-widest text-[#5a6b82] mb-2">
          Mode Overview // Select a card to filter map pools
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {modeCards.map(card => {
            const Icon = card.icon;
            const isActive = selectedMode === card.id;
            return (
              <button
                key={card.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelectedMode(isActive ? 'ALL' : card.id)}
                title={isActive ? 'Show all modes' : `Filter to ${card.label}`}
                className={`text-left bg-[#111723] border p-3.5 clip-corner-sm flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#f5b700] shadow-[0_0_16px_rgba(245,183,0,0.2)]'
                    : 'border-[#223046] hover:border-[#354b6d]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded border flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${card.color}1a`,
                      borderColor: `${card.color}4d`,
                      color: card.color
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-display font-bold text-white text-sm block tracking-wide truncate">
                      {card.poolTitle}
                    </span>
                    <span className="text-[11px] font-mono-num text-[#7d90a6]">
                      {card.maps.length} Active Maps
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono-num text-xs shrink-0">
                  <span
                    className="font-bold text-base block"
                    style={{ color: card.color }}
                  >
                    {card.stats.total > 0
                      ? `${Math.round((card.stats.wins / card.stats.total) * 100)}%`
                      : '0%'}
                  </span>
                  <span className="text-[#7d90a6] text-[10px]">
                    {card.stats.wins}W - {card.stats.losses}L
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map listings by mode */}
      <div className="space-y-8">
        {modeCards.map(card => {
          if (selectedMode !== 'ALL' && selectedMode !== card.id) return null;
          if (!card.maps.length) return null;
          const Icon = card.icon;
          return (
            <section key={card.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <Icon size={18} style={{ color: card.color }} />
                <h3 className="font-display font-extrabold text-lg text-white tracking-wider m-0">
                  {card.sectionTitle} ({card.maps.length})
                </h3>
              </div>
              <div className="space-y-3">
                {card.maps.map(map => (
                  <MapCard key={`${map.mode}-${map.map}`} mapData={map} />
                ))}
              </div>
            </section>
          );
        })}

        {visibleMaps.length === 0 && (
          <div className="bg-[#111723] border border-[#223046] p-6 text-center clip-corner-sm">
            <p className="text-sm font-mono-num text-[#7d90a6]">
              No maps match the selected tier and mode.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
