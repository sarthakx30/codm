import React, { useState } from 'react';
import MatchBannerCard from './MatchBannerCard';
import { Sparkles } from 'lucide-react';
import { THEME_CLASSES } from '../../config/theme';

export default function MatchList({
  matches = [],
  onSaveMatch,
  onDeleteMatch,
  onOpenScrimModal,
  showToast
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
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
    if (!selectedIds.has(id) && selectedIds.size >= 5) {
      if (showToast) showToast('Select up to 5 maps for a scrim card.');
      return;
    }
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectMode = () => {
    if (editingId) {
      if (showToast) showToast('Save or cancel the current edit first.');
      return;
    }
    setIsSelectMode(prev => !prev);
    if (isSelectMode) setSelectedIds(new Set());
  };

  const toggleExpand = (m) => {
    if (isSelectMode) {
      toggleSelectMatch(m.id);
      return;
    }

    if (editingId && editingId !== m.id) {
      if (showToast) showToast('Save or cancel the current edit first.');
      return;
    }

    if (expandedId === m.id) {
      setExpandedId(null);
      setEditingId(null);
    } else {
      setExpandedId(m.id);
      setEditingId(null);
    }
  };

  const handleEdit = (matchId) => {
    setExpandedId(matchId);
    setEditingId(matchId);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
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
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-wider m-0 flex flex-wrap items-center gap-2.5">
            <span className="w-1.5 h-5 bg-primary inline-block shadow-[0_0_8px_rgba(245,183,0,0.6)]"></span>
            MATCH HISTORY
            <span className="text-xs font-mono-num font-normal text-[#7d90a6] bg-[#111723] px-2 py-0.5 rounded border border-[#223046]">
              {sortedMatches.length} GAMES
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={toggleSelectMode}
            disabled={!!editingId}
            className={`w-full sm:w-auto justify-center px-3 py-1.5 text-xs font-display flex items-center gap-1.5 border transition-all clip-corner-sm ${
              editingId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
              isSelectMode
                ? `${THEME_CLASSES.badgeGold} font-bold shadow-[0_0_10px_rgba(245,183,0,0.3)]`
                : `${THEME_CLASSES.btnGhost}`
            }`}
            title={editingId ? 'Save or cancel the current edit first' : 'Select 1-5 maps to compile a shareable Scrim Graphic Card'}
          >
            <Sparkles size={13} className={isSelectMode ? 'text-secondary' : 'text-primary'} />
            <span>{isSelectMode ? 'CANCEL SELECTION' : 'SELECT MAPS FOR CARD'}</span>
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
            isEditing={editingId === m.id}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onSaveMatch={onSaveMatch}
            onDelete={handleDelete}
            onOpenScrimModal={onOpenScrimModal}
            showToast={showToast}
          />
        ))}
      </div>

      {/* Floating Scrim Generator Action Bar */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-8 left-0 right-0 lg:left-64 xl:left-72 max-w-4xl mx-auto px-3 sm:px-4 z-30 animate-slideUp">
          <div className="bg-[#0c111a]/98 border-2 border-[#f5b700] backdrop-blur-md p-3 clip-corner shadow-[0_0_35px_rgba(245,183,0,0.4)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 shrink-0 rounded-full bg-[#f5b700] animate-pulse shadow-[0_0_8px_#f5b700]" />
              <span className="font-display font-bold text-white text-sm sm:text-base tracking-wide">
                {selectedIds.size} {selectedIds.size === 1 ? 'MAP' : 'MAPS'} SELECTED
              </span>
              <span className="hidden sm:inline text-[10px] font-mono-num text-[#7d90a6]">
                MAX 5
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-2 text-xs font-mono-num text-[#7d90a6] hover:text-white cursor-pointer"
              >
                CLEAR
              </button>
              <button
                type="button"
                onClick={() => {
                  const selectedList = sortedMatches.filter(m => selectedIds.has(m.id));
                  if (onOpenScrimModal) onOpenScrimModal(selectedList);
                }}
                className={`flex-1 sm:flex-none px-4 py-2 ${THEME_CLASSES.btnPrimary} text-xs clip-corner-sm flex items-center justify-center gap-1.5 cursor-pointer`}
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
