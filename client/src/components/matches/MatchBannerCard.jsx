import React from 'react';
import { getMapMetadata } from '../../utils/mapImages';
import ScoreboardTable from './ScoreboardTable';
import { parseTier } from '../../engine/playerAnalytics';
import {
  Trophy,
  Save,
  Trash2,
  Sparkles,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function MatchBannerCard({
  match,
  isExpanded,
  onToggleExpand,
  isSelectMode,
  isSelected,
  onToggleSelect,
  editState,
  onFieldChange,
  onSave,
  onDelete,
  onOpenScrimModal
}) {
  const m = match;
  const isWin = m.result === 'W';
  const scoreDiff = (m.score_us || 0) - (m.score_them || 0);
  const diffSign = scoreDiff > 0 ? `+${scoreDiff}` : `${scoreDiff}`;

  const currentEdit = editState || {
    opponent: m.opponent || '',
    tier: m.tier || '',
    game_type: m.game_type || ''
  };
  const pt = parseTier(currentEdit.tier);

  // Map image and fallback theme
  const mapMeta = getMapMetadata(m.map);

  // Top performer or MVP on our team
  const sortedPlayers = (m.us || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  const topPlayer = sortedPlayers[0] || null;

  // Format played_at date e.g. "OCT 5, 00:51"
  const formattedDate = (() => {
    if (m.played_at) {
      try {
        const d = new Date(m.played_at);
        return d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }).toUpperCase() + ', ' + d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      } catch (_) {}
    }
    return m.played_at_raw || '';
  })();

  return (
    <div
      className={`border transition-all clip-corner relative overflow-hidden group shadow-lg ${
        isSelected
          ? 'border-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.3)]'
          : isWin
          ? 'border-[#223046] hover:border-[#00e5ff]/60'
          : 'border-[#223046] hover:border-[#ff334b]/60'
      }`}
    >
      {/* Cinematic Map Banner Header (User's Reference Style) */}
      <div
        onClick={() => {
          if (isSelectMode) onToggleSelect(m.id);
          else onToggleExpand(m);
        }}
        className="relative min-h-[96px] sm:min-h-[110px] p-4 flex items-center justify-between cursor-pointer select-none overflow-hidden"
      >
        {/* Background Map Image with Fallback Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src={mapMeta.imageUrl}
            alt={m.map}
            className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              // Graceful fallback to styled tactical gradient if image is not on disk yet
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Fallback procedural gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r ${mapMeta.theme.gradient} -z-10`} />

          {/* Vignette Overlay for Crisp Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#06090e]/95 via-[#06090e]/75 to-[#06090e]/90" />
          <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Left Result Accent Bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 ${
            isSelected
              ? 'bg-[#00e5ff] shadow-[0_0_12px_#00e5ff]'
              : isWin
              ? 'bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)]'
              : 'bg-[#ff334b] shadow-[0_0_10px_rgba(255,51,75,0.5)]'
          }`}
        />

        {/* Content Container */}
        <div className="relative z-10 w-full flex items-center justify-between gap-3">
          
          {/* Left: Checkbox (in select mode) + Metadata + Map Name */}
          <div className="flex items-center gap-3">
            {isSelectMode && (
              <div className="text-[#00e5ff] flex items-center justify-center pl-1">
                {isSelected ? (
                  <CheckSquare size={20} className="text-[#00e5ff]" />
                ) : (
                  <Square size={20} className="text-[#7d90a6]" />
                )}
              </div>
            )}

            <div>
              {/* Metadata Tag Row */}
              <div className="flex items-center gap-2 text-xs font-mono-num mb-1 flex-wrap">
                <span
                  className={`font-bold tracking-wider px-1.5 py-0.2 rounded-xs text-[11px] ${
                    isWin
                      ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/40'
                      : 'bg-[#ff334b]/20 text-[#ff334b] border border-[#ff334b]/40'
                  }`}
                >
                  {isWin ? 'WIN' : 'LOSS'}
                </span>
                <span className="text-[#a0aec0] uppercase tracking-wider font-semibold">
                  {m.mode || 'HARDPOINT'}
                </span>
                {formattedDate && (
                  <span className="text-[#64748b]">
                    {formattedDate}
                  </span>
                )}
                {m.opponent && (
                  <span className="text-[#ffb800] font-bold">
                    VS {m.opponent.toUpperCase()}
                  </span>
                )}
                {m.tier && (
                  <span className="bg-[#ffb800]/15 text-[#ffb800] border border-[#ffb800]/40 px-1 text-[10px]">
                    {m.tier}
                  </span>
                )}
              </div>

              {/* Big Map Name */}
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wider m-0 leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                {(m.map || 'UNKNOWN MAP').toUpperCase()}
              </h3>
            </div>
          </div>

          {/* Right: Top Player Stats + Score + Differential */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Top Squad Performer Badge (Hidden on very narrow mobile screens) */}
            {topPlayer && (
              <div className="hidden md:flex flex-col items-end text-xs font-mono-num">
                <div className="flex items-center gap-1.5 text-[#e2e8f0]">
                  <Trophy size={13} className={topPlayer.mvp ? 'text-[#ffb800]' : 'text-[#7d90a6]'} />
                  <span className="font-bold">{topPlayer.kills} / {topPlayer.deaths} / {topPlayer.assists}</span>
                  {topPlayer.mvp && (
                    <span className="text-[10px] font-bold bg-[#ffb800] text-black px-1 rounded-xs">
                      MVP
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#7d90a6]">
                  {topPlayer.name}
                </span>
              </div>
            )}

            {/* Scoreus : Scorethem */}
            <div className="text-right">
              <div className="font-mono-num text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                <span>{m.score_us}</span>
                <span className="text-[#7d90a6] mx-1">:</span>
                <span>{m.score_them}</span>
              </div>
              <span className="text-[10px] font-mono-num text-[#7d90a6] tracking-widest block uppercase">
                {m.game_type || 'MATCH'}
              </span>
            </div>

            {/* Score Differential Banner Accent (+73 / -33) */}
            <div className="min-w-[55px] sm:min-w-[70px] text-right">
              <span
                className={`font-display text-2xl sm:text-3xl font-extrabold tracking-tight ${
                  isWin ? 'text-[#10b981]' : 'text-[#ff334b]'
                }`}
              >
                {diffSign}
              </span>
            </div>

            {/* Expand / Collapse Icon */}
            {!isSelectMode && (
              <div className="text-[#7d90a6] group-hover:text-white transition-colors">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Expanded Details Section */}
      {isExpanded && !isSelectMode && (
        <div className="p-4 border-t border-[#223046] bg-[#0c111a]/95 backdrop-blur-md animate-fadeIn">
          {/* Rosters */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs font-display text-[#00e5ff] font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                OUR TEAM ROSTER ({m.us?.length || 0})
              </div>
              <ScoreboardTable players={m.us} team="us" />
            </div>

            <div>
              <div className="text-xs font-display text-[#ff334b] font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff334b]" />
                OPPONENT ROSTER ({m.them?.length || 0})
              </div>
              <ScoreboardTable players={m.them} team="them" />
            </div>
          </div>

          {/* Match Metadata & Actions Bar */}
          <div className="bg-[#161e2e] border border-[#223046] p-3.5 clip-corner-sm">
            <div className="text-xs font-display text-[#00e5ff] tracking-wider mb-2.5 font-bold">
              EDIT MATCH METADATA
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono-num mb-3">
              {/* Opponent Input */}
              <div>
                <label className="block text-[#7d90a6] mb-1">Opponent Clan / Team</label>
                <input
                  type="text"
                  value={currentEdit.opponent}
                  onChange={e => onFieldChange(m.id, 'opponent', e.target.value)}
                  placeholder="e.g. Luminosity"
                  className="w-full bg-[#080c14] border border-[#354b6d] text-white px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#00e5ff]"
                />
              </div>

              {/* Tier Selector */}
              <div>
                <div className="flex justify-between items-center text-[#7d90a6] mb-1">
                  <span>Opponent Tier</span>
                  <span className="text-[#ffb800] font-bold">{currentEdit.tier || 'None'}</span>
                </div>
                <div className="flex gap-1 mb-1">
                  {['T1', 'T2', 'T3', ''].map(val => {
                    const isActive = pt.main === val || (!pt.main && !val);
                    return (
                      <button
                        type="button"
                        key={val}
                        onClick={() => {
                          const newTier = val ? `${val}${pt.sub || 'M'}` : '';
                          onFieldChange(m.id, 'tier', newTier);
                        }}
                        className={`flex-1 py-1 font-display text-xs border ${
                          isActive
                            ? 'border-[#ffb800] text-[#ffb800] bg-[#ffb800]/15'
                            : 'border-[#223046] text-[#7d90a6] bg-[#080c14]'
                        }`}
                      >
                        {val ? val.replace('T', 'T') : 'None'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[#7d90a6] mb-1">Match Category</label>
                <div className="flex gap-1">
                  {['scrim', 'tournament'].map(gt => {
                    const isActive = currentEdit.game_type === gt;
                    return (
                      <button
                        type="button"
                        key={gt}
                        onClick={() =>
                          onFieldChange(m.id, 'game_type', isActive ? '' : gt)
                        }
                        className={`flex-1 py-1 font-display text-xs border uppercase ${
                          isActive
                            ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/15'
                            : 'border-[#223046] text-[#7d90a6] bg-[#080c14]'
                        }`}
                      >
                        {gt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#223046]">
              <button
                type="button"
                onClick={() => onSave(m.id)}
                className="flex-1 sm:flex-initial px-4 py-1.5 bg-[#00e5ff] hover:bg-[#00c8e0] text-[#080c14] font-display font-bold text-xs tracking-wider clip-corner-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.25)]"
              >
                <Save size={13} />
                <span>SAVE DETAILS</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenScrimModal && onOpenScrimModal([m])}
                className="flex-1 sm:flex-initial px-4 py-1.5 border border-[#ffb800]/60 hover:bg-[#ffb800]/15 text-[#ffb800] font-display font-bold text-xs tracking-wider clip-corner-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,184,0,0.15)]"
              >
                <Sparkles size={13} />
                <span>SHARE GRAPHIC</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(m.id)}
                className="px-3 py-1.5 border border-[#ff334b]/60 hover:bg-[#ff334b]/15 text-[#ff334b] font-display text-xs clip-corner-sm transition-all cursor-pointer ml-auto"
                title="Delete Match"
              >
                <Trash2 size={13} />
                <span>DELETE</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
