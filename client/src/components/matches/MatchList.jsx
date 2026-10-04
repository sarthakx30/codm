import React, { useState } from 'react';
import ScoreboardTable from './ScoreboardTable';
import { parseTier } from '../../engine/playerAnalytics';
import { Trash2, Save, Sparkles, CheckSquare, Square, Layers, X } from 'lucide-react';

export default function MatchList({
  matches = [],
  onUpdateMatch,
  onDeleteMatch,
  onOpenScrimModal
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [editState, setEditState] = useState({});
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  if (!matches.length) {
    return (
      <div className="bg-[#111723] border border-[#223046] p-6 text-center clip-corner-sm">
        <p className="text-sm font-mono-num text-[#7d90a6]">No matches recorded yet.</p>
      </div>
    );
  }

  const toggleSelectMatch = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpand = (m) => {
    if (isSelectMode) {
      toggleSelectMatch(m.id);
      return;
    }

    if (expandedId === m.id) {
      setExpandedId(null);
    } else {
      setExpandedId(m.id);
      setEditState(prev => ({
        ...prev,
        [m.id]: {
          opponent: m.opponent || '',
          tier: m.tier || '',
          game_type: m.game_type || ''
        }
      }));
    }
  };

  const handleFieldChange = (matchId, field, val) => {
    setEditState(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: val
      }
    }));
  };

  const handleSave = (matchId) => {
    const edits = editState[matchId];
    if (edits && onUpdateMatch) {
      onUpdateMatch(matchId, edits);
    }
  };

  const handleDelete = (matchId) => {
    if (window.confirm('Delete this match and all associated player records?')) {
      if (onDeleteMatch) onDeleteMatch(matchId);
    }
  };

  // Reverse chronologically
  const sortedMatches = matches.slice().sort((a, b) => {
    const ta = new Date(a.played_at || a.added_at || 0).getTime();
    const tb = new Date(b.played_at || b.added_at || 0).getTime();
    return tb - ta;
  });

  return (
    <div className="space-y-3 mb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-white flex items-center gap-2 m-0">
          <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
          MATCH HISTORY ({sortedMatches.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsSelectMode(prev => !prev);
              if (isSelectMode) setSelectedIds(new Set());
            }}
            className={`px-2.5 py-1 text-xs font-display flex items-center gap-1.5 border transition-all clip-corner-sm cursor-pointer ${
              isSelectMode
                ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/15 font-bold shadow-[0_0_8px_rgba(0,229,255,0.3)]'
                : 'border-[#354b6d] text-[#7d90a6] hover:text-white bg-[#111723]'
            }`}
          >
            <Layers size={13} />
            <span>{isSelectMode ? 'EXIT SELECTION' : 'SELECT SCRIM'}</span>
          </button>
        </div>
      </div>

      {sortedMatches.map(m => {
        const isWin = m.result === 'W';
        const isExpanded = expandedId === m.id;
        const isSelected = selectedIds.has(m.id);
        const currentEdit = editState[m.id] || {
          opponent: m.opponent || '',
          tier: m.tier || '',
          game_type: m.game_type || ''
        };
        const pt = parseTier(currentEdit.tier);

        return (
          <div
            key={m.id}
            className={`bg-[#111723] border border-[#223046] border-l-4 transition-all clip-corner ${
              isSelected
                ? 'border-[#00e5ff] bg-[#111e2e]'
                : isWin
                ? 'border-l-[#00e5ff]'
                : 'border-l-[#ff334b]'
            }`}
          >
            {/* Header summary button */}
            <div
              onClick={() => toggleExpand(m)}
              className="flex items-center cursor-pointer hover:bg-[#161e2e]/40 transition-colors select-none"
            >
              {isSelectMode && (
                <div className="pl-3.5 text-[#00e5ff] flex items-center justify-center">
                  {isSelected ? (
                    <CheckSquare size={19} className="text-[#00e5ff]" />
                  ) : (
                    <Square size={19} className="text-[#7d90a6]" />
                  )}
                </div>
              )}
              <div className="flex-1 p-3.5">
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`font-display text-2xl font-bold tracking-wider ${
                        isWin ? 'text-[#00e5ff]' : 'text-[#ff334b]'
                      }`}
                    >
                      {isWin ? 'VICTORY' : 'DEFEAT'}
                    </span>
                    <span className="font-mono-num text-xl font-bold text-white">
                      {m.score_us} - {m.score_them}
                    </span>
                  </div>
                  <span className="text-xs font-mono-num text-[#7d90a6]">{m.played_at_raw}</span>
                </div>

                {/* Tag row */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono-num">
                  {m.tier && (
                    <span className="bg-[#ffb800]/15 border border-[#ffb800] text-[#ffb800] px-1.5 py-0.2">
                      {m.tier}
                    </span>
                  )}
                  {m.game_type && (
                    <span className="bg-white/5 border border-[#223046] text-[#f0f4f8] px-1.5 py-0.2 uppercase">
                      {m.game_type}
                    </span>
                  )}
                  {m.opponent && (
                    <span className="font-bold text-white">VS {m.opponent}</span>
                  )}
                  <span className="text-[#7d90a6]">
                    {m.map || 'Unknown'} - {m.mode || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="p-3.5 pt-1 border-t border-[#223046] bg-[#0c111a]/50">
                <ScoreboardTable players={m.us} team="us" />
                <ScoreboardTable players={m.them} team="them" />

                {/* Match Metadata Form */}
                <div className="bg-[#161e2e] border border-[#223046] p-3 clip-corner-sm mt-3">
                  <div className="text-xs font-display text-[#00e5ff] tracking-wider mb-2 font-bold">
                    EDIT MATCH DETAILS
                  </div>

                  <div className="space-y-2.5 text-xs font-mono-num">
                    {/* Opponent Input */}
                    <div>
                      <label className="block text-[#7d90a6] mb-1">Opponent Team</label>
                      <input
                        type="text"
                        value={currentEdit.opponent}
                        onChange={e => handleFieldChange(m.id, 'opponent', e.target.value)}
                        placeholder="e.g. Luminosity"
                        className="w-full bg-[#080c14] border border-[#354b6d] text-white px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#00e5ff]"
                      />
                    </div>

                    {/* Tier Selector */}
                    <div>
                      <div className="flex justify-between items-center text-[#7d90a6] mb-1">
                        <span>Opponent Tier</span>
                        <span className="text-[#ffb800] font-bold">
                          Selected: {currentEdit.tier || 'None'}
                        </span>
                      </div>
                      {/* Main Tier Chips */}
                      <div className="flex gap-1 mb-1">
                        {['T1', 'T2', 'T3', ''].map(val => {
                          const isActive = pt.main === val || (!pt.main && !val);
                          return (
                            <button
                              type="button"
                              key={val}
                              onClick={() => {
                                const newTier = val ? `${val}${pt.sub || 'M'}` : '';
                                handleFieldChange(m.id, 'tier', newTier);
                              }}
                              className={`flex-1 py-1 font-display text-xs border ${
                                isActive
                                  ? 'border-[#ffb800] text-[#ffb800] bg-[#ffb800]/15'
                                  : 'border-[#223046] text-[#7d90a6] bg-[#080c14]'
                              }`}
                            >
                              {val ? val.replace('T', 'Tier ') : 'None'}
                            </button>
                          );
                        })}
                      </div>

                      {/* Sub-tier Chips (High / Mid / Low) */}
                      {pt.main && (
                        <div className="flex gap-1">
                          {['H', 'M', 'L'].map(subVal => {
                            const isActive = pt.sub === subVal;
                            const label = subVal === 'H' ? 'High' : subVal === 'M' ? 'Mid' : 'Low';
                            return (
                              <button
                                type="button"
                                key={subVal}
                                onClick={() => handleFieldChange(m.id, 'tier', `${pt.main}${subVal}`)}
                                className={`flex-1 py-0.5 text-[11px] border font-display ${
                                  isActive
                                    ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/15'
                                    : 'border-[#223046] text-[#7d90a6] bg-[#080c14]'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Game Type Selector */}
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
                                handleFieldChange(m.id, 'game_type', isActive ? '' : gt)
                              }
                              className={`flex-1 py-1 font-display text-xs border capitalize ${
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

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSave(m.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#00e5ff] text-[#080c14] font-display font-bold text-sm clip-corner-sm hover:brightness-110 transition-all cursor-pointer"
                      >
                        <Save size={13} />
                        <span>SAVE DETAILS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenScrimModal && onOpenScrimModal([m])}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#00e5ff]/50 text-[#00e5ff] hover:bg-[#00e5ff]/10 font-display text-sm clip-corner-sm transition-all cursor-pointer"
                        title="Generate Match Graphic"
                      >
                        <Sparkles size={13} />
                        <span>GRAPHIC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-[#ff334b] text-[#ff334b] hover:bg-[#ff334b]/15 font-display text-sm clip-corner-sm transition-all cursor-pointer"
                        title="Delete Match"
                      >
                        <Trash2 size={13} />
                        <span>DELETE</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Floating Scrim Generator Action Bar */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-2xl mx-auto px-3.5 z-40 animate-slideUp">
          <div className="bg-[#0c111a]/95 border-2 border-[#00e5ff] backdrop-blur-md p-3 clip-corner shadow-[0_0_30px_rgba(0,229,255,0.35)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] animate-pulse" />
              <span className="font-display font-bold text-white text-sm tracking-wide">
                {selectedIds.size} {selectedIds.size === 1 ? 'MAP' : 'MAPS'} SELECTED
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-2.5 py-1 text-xs font-mono-num text-[#7d90a6] hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedList = sortedMatches.filter(m => selectedIds.has(m.id));
                  if (onOpenScrimModal) onOpenScrimModal(selectedList);
                }}
                className="px-4 py-1.5 bg-[#00e5ff] hover:bg-[#00c8e0] text-[#080c14] font-display font-bold text-xs tracking-wider clip-corner-sm flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,229,255,0.4)] cursor-pointer"
              >
                <Sparkles size={14} />
                <span>GENERATE SCRIM CARD</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
