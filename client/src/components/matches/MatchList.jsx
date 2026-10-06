import React, { useState } from 'react';
import MatchBannerCard from './MatchBannerCard';
import { Layers, Sparkles } from 'lucide-react';
import { THEME_CLASSES } from '../../config/theme';

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
      <div className="bg-[#111723] border border-[#223046] p-8 text-center clip-corner-sm">
        <p className="text-sm font-mono-num text-[#7d90a6]">No matches recorded yet. Upload a screenshot to get started.</p>
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
    <div className="space-y-4 mb-10">
      {/* Header matching user reference inspiration */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wider m-0 flex items-center gap-2.5">
            <span className="w-1.5 h-5 bg-primary inline-block shadow-[0_0_8px_rgba(245,183,0,0.6)]"></span>
            MATCH HISTORY
            <span className="text-xs font-mono-num font-normal text-[#7d90a6] bg-[#111723] px-2 py-0.5 rounded border border-[#223046]">
              {sortedMatches.length} GAMES
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsSelectMode(prev => !prev);
              if (isSelectMode) setSelectedIds(new Set());
            }}
            className={`px-3 py-1.5 text-xs font-display flex items-center gap-1.5 border transition-all clip-corner-sm cursor-pointer ${
              isSelectMode
                ? `${THEME_CLASSES.badgeGold} font-bold shadow-[0_0_10px_rgba(245,183,0,0.3)]`
                : `${THEME_CLASSES.btnGhost}`
            }`}
            title="Select 2-5 maps from a series to compile and export a shareable Scrim Graphic Card"
          >
            <Sparkles size={13} className={isSelectMode ? 'text-secondary' : 'text-primary'} />
            <span>{isSelectMode ? 'CANCEL SELECTION' : 'SELECT SCRIM SERIES'}</span>
          </button>
        </div>
      </div>

      {/* Cinematic Match Banner Cards List */}
      <div className="space-y-2.5">
        {sortedMatches.map(m => (
          <MatchBannerCard
            key={m.id}
            match={m}
            isExpanded={expandedId === m.id}
            onToggleExpand={toggleExpand}
            isSelectMode={isSelectMode}
            isSelected={selectedIds.has(m.id)}
            onToggleSelect={toggleSelectMatch}
            editState={editState[m.id]}
            onFieldChange={handleFieldChange}
            onSave={handleSave}
            onDelete={handleDelete}
            onOpenScrimModal={onOpenScrimModal}
          />
        ))}
      </div>

      {/* Floating Scrim Generator Action Bar */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-16 lg:bottom-8 left-0 right-0 lg:left-64 xl:left-72 max-w-4xl mx-auto px-4 z-40 animate-slideUp">
          <div className="bg-[#0c111a]/98 border-2 border-[#f5b700] backdrop-blur-md p-3.5 clip-corner shadow-[0_0_35px_rgba(245,183,0,0.4)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f5b700] animate-pulse shadow-[0_0_8px_#f5b700]" />
              <span className="font-display font-bold text-white text-base tracking-wide">
                {selectedIds.size} {selectedIds.size === 1 ? 'MAP' : 'MAPS'} SELECTED FOR SCRIM SERIES
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-xs font-mono-num text-[#7d90a6] hover:text-white cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedList = sortedMatches.filter(m => selectedIds.has(m.id));
                  if (onOpenScrimModal) onOpenScrimModal(selectedList);
                }}
                className={`px-4 py-2 ${THEME_CLASSES.btnPrimary} text-xs clip-corner-sm flex items-center gap-1.5 cursor-pointer`}
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
