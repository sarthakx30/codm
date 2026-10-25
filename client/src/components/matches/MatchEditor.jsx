import React, { useState } from 'react';
import { Plus, Save, Star, Trash2, X } from 'lucide-react';
import TierPicker from '../common/TierPicker';
import ModePicker from '../common/ModePicker';
import GameTypePicker from '../common/GameTypePicker';
import { THEME_CLASSES } from '../../config/theme';
import {
  buildMatchSavePayload,
  createEmptyPlayer,
  draftFromMatch,
  isDraftValid,
  resultMismatch,
  toInt
} from './matchEditorModel';

const INPUT_CLASS = 'w-full bg-[#080c14] border border-[#354b6d] text-white px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#f5b700] text-xs font-mono-num';
const STAT_INPUT_CLASS = `${INPUT_CLASS} px-1.5 py-1 text-right`;

const STAT_FIELDS = [
  ['score', 'Score'],
  ['kills', 'Kills'],
  ['deaths', 'Deaths'],
  ['assists', 'Assists'],
  ['impact', 'Impact'],
  ['time', 'Time (s)']
];

const TEAM_TABS = [
  { id: 'us', label: 'OUR TEAM' },
  { id: 'them', label: 'OPPONENT' }
];

function SectionLabel({ children, className = '' }) {
  return (
    <div className={`text-[10px] font-display font-bold text-[#8292a8] tracking-[0.18em] flex items-center gap-1.5 ${className}`}>
      <span className="w-1 h-3 bg-[#f5b700]" />
      {children}
    </div>
  );
}

function selectInput(event) {
  event.target.select();
}

export default function MatchEditor({ match, onSave, onCancel, showToast }) {
  const [draft, setDraft] = useState(() => draftFromMatch(match));
  const [team, setTeam] = useState('us');
  const [saving, setSaving] = useState(false);

  const canSave = isDraftValid(draft);
  const mismatch = resultMismatch(draft);
  const activePlayers = draft[team] || [];
  const emptyNames = [...draft.us, ...draft.them].filter(player => !player.name.trim()).length;
  const modeMissing = !draft.mode;

  const updateField = (field, value) => {
    setDraft(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'played_at') {
        next.played_at_touched = true;
      }
      if (field === 'score_us' || field === 'score_them') {
        const scoreUs = toInt(field === 'score_us' ? value : prev.score_us);
        const scoreThem = toInt(field === 'score_them' ? value : prev.score_them);
        if (scoreUs !== scoreThem) {
          next.result = scoreUs > scoreThem ? 'W' : 'L';
        }
      }
      return next;
    });
  };

  const updatePlayer = (index, field, value) => {
    setDraft(prev => ({
      ...prev,
      [team]: prev[team].map((player, playerIndex) => (
        playerIndex === index ? { ...player, [field]: value } : player
      ))
    }));
  };

  const toggleMvp = (index) => {
    setDraft(prev => ({
      ...prev,
      [team]: prev[team].map((player, playerIndex) => ({
        ...player,
        mvp: playerIndex === index ? !player.mvp : false
      }))
    }));
  };

  const addPlayer = () => {
    setDraft(prev => ({
      ...prev,
      [team]: [createEmptyPlayer(), ...prev[team]]
    }));
  };

  const removePlayer = (index) => {
    setDraft(prev => ({
      ...prev,
      [team]: prev[team].filter((_, playerIndex) => playerIndex !== index)
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (!canSave) {
      if (showToast) showToast('Pick a game mode and name every player.');
      return;
    }

    setSaving(true);
    try {
      const saved = await onSave(buildMatchSavePayload(match, draft));
      if (saved) {
        onCancel();
      } else {
        setSaving(false);
      }
    } catch {
      setSaving(false);
      if (showToast) showToast('Could not save the match.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#111723] border border-[#2a3a54] p-3 sm:p-4 clip-corner-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-xs font-display text-[#ffd700] tracking-[0.18em] font-bold">EDIT MATCH</div>
          <p className="text-[10px] text-[#5a6b82] font-mono-num mt-0.5">
            Match details and both scoreboards save together.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          aria-label="Cancel editing"
          className="shrink-0 p-1.5 text-[#7d90a6] hover:text-white border border-[#223046] hover:border-[#354b6d] rounded-sm transition-colors disabled:opacity-40"
        >
          <X size={15} />
        </button>
      </div>

      <div className="border-t border-[#223046] pt-3">
        <SectionLabel className="mb-2">MATCH INFO</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-num">
          <label className="block">
            <span className="block text-[10px] text-[#7d90a6] mb-1 uppercase tracking-wider">Opponent</span>
            <input
              type="text"
              value={draft.opponent}
              onChange={event => updateField('opponent', event.target.value)}
              placeholder="Opponent team"
              className={INPUT_CLASS}
            />
          </label>

          <label className="block">
            <span className="block text-[10px] text-[#7d90a6] mb-1 uppercase tracking-wider">Map</span>
            <input
              type="text"
              value={draft.map}
              onChange={event => updateField('map', event.target.value)}
              placeholder="Map name"
              className={`${INPUT_CLASS} uppercase`}
            />
          </label>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-[#7d90a6] uppercase tracking-wider">Game mode</span>
              {!draft.mode && <span className="text-[#ff334b] text-[9px] font-bold">REQUIRED</span>}
            </div>
            <ModePicker value={draft.mode} onChange={value => updateField('mode', value)} />
          </div>

          <div>
            <span className="block text-[10px] text-[#7d90a6] mb-1 uppercase tracking-wider">Match category</span>
            <GameTypePicker value={draft.game_type} onChange={value => updateField('game_type', value)} />
          </div>

          <div className="sm:col-span-2">
            <span className="block text-[10px] text-[#7d90a6] mb-1 uppercase tracking-wider">Opponent tier</span>
            <TierPicker value={draft.tier} onChange={value => updateField('tier', value)} />
          </div>

          <label className="block">
            <span className="block text-[10px] text-[#7d90a6] mb-1 uppercase tracking-wider">Played at</span>
            <input
              type="datetime-local"
              step="1"
              value={draft.played_at}
              onChange={event => updateField('played_at', event.target.value)}
              className={`${INPUT_CLASS} [color-scheme:dark]`}
            />
          </label>

          <div>
            <span className="block text-[10px] text-[#7d90a6] mb-1 uppercase tracking-wider">Result & map score</span>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex border border-[#354b6d] rounded-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => updateField('result', 'W')}
                  aria-pressed={draft.result === 'W'}
                  className={`px-2.5 py-1.5 text-[10px] font-display font-bold tracking-wider transition-colors ${
                    draft.result === 'W'
                      ? 'bg-[#10b981]/20 text-[#10b981]'
                      : 'text-[#7d90a6] hover:text-white'
                  }`}
                >
                  WIN
                </button>
                <button
                  type="button"
                  onClick={() => updateField('result', 'L')}
                  aria-pressed={draft.result === 'L'}
                  className={`px-2.5 py-1.5 text-[10px] font-display font-bold tracking-wider transition-colors ${
                    draft.result === 'L'
                      ? 'bg-[#ff334b]/20 text-[#ff334b]'
                      : 'text-[#7d90a6] hover:text-white'
                  }`}
                >
                  LOSS
                </button>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  aria-label="Our score"
                  value={draft.score_us}
                  onChange={event => updateField('score_us', event.target.value)}
                  onFocus={selectInput}
                  className={`${STAT_INPUT_CLASS} w-16 text-center`}
                />
                <span className="text-[#5a6b82]">:</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  aria-label="Opponent score"
                  value={draft.score_them}
                  onChange={event => updateField('score_them', event.target.value)}
                  onFocus={selectInput}
                  className={`${STAT_INPUT_CLASS} w-16 text-center`}
                />
              </div>
            </div>
            {mismatch && (
              <p className="text-[10px] text-[#ff334b] mt-1">Result and score differ.</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-[#223046] mt-4 pt-3">
        <SectionLabel className="mb-2">SCOREBOARD</SectionLabel>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex gap-1.5" role="group" aria-label="Scoreboard team">
            {TEAM_TABS.map(tab => {
              const hasEmptyName = draft[tab.id].some(player => !player.name.trim());
              const active = team === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTeam(tab.id)}
                  aria-pressed={active}
                  className={`px-3 py-1.5 text-[10px] font-display font-bold tracking-wider transition-all clip-corner-sm ${
                    active
                      ? (tab.id === 'us' ? THEME_CLASSES.badgeGold : THEME_CLASSES.badgeLoss)
                      : THEME_CLASSES.btnGhost
                  }`}
                >
                  {tab.label} ({draft[tab.id].length})
                  {hasEmptyName && (
                    <span className="ml-1 inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#ff334b] text-white text-[8px] leading-none font-bold">
                      !
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addPlayer}
            className={`px-2.5 py-1 ${THEME_CLASSES.btnGhost} text-[10px] font-display font-bold tracking-wider clip-corner-sm flex items-center gap-1.5`}
          >
            <Plus size={12} />
            <span>ADD PLAYER</span>
          </button>
        </div>

        <div className="space-y-2">
          {activePlayers.map((player, index) => (
            <div key={index} className="border border-[#223046] bg-[#0c111a] p-2.5 clip-corner-sm">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={player.name}
                  onChange={event => updatePlayer(index, 'name', event.target.value)}
                  placeholder="Player name"
                  aria-label="Player name"
                  className={`${INPUT_CLASS} flex-1 min-w-0`}
                />
                <button
                  type="button"
                  onClick={() => toggleMvp(index)}
                  aria-pressed={player.mvp}
                  aria-label="Set as team MVP"
                  title="Set as team MVP"
                  className={`shrink-0 flex items-center gap-1 px-2 py-1.5 text-[10px] font-display font-bold transition-all clip-corner-sm ${
                    player.mvp ? THEME_CLASSES.badgeGold : THEME_CLASSES.btnGhost
                  }`}
                >
                  <Star size={12} fill={player.mvp ? 'currentColor' : 'none'} />
                  <span className="hidden sm:inline">MVP</span>
                </button>
                <button
                  type="button"
                  onClick={() => removePlayer(index)}
                  aria-label={`Remove ${player.name || 'player'}`}
                  title="Remove player"
                  className="shrink-0 p-1.5 text-[#7d90a6] hover:text-[#ff334b] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2">
                {STAT_FIELDS.map(([field, label]) => (
                  <label key={field} className="block min-w-0">
                    <span className="block text-[9px] text-[#5a6b82] uppercase tracking-wider mb-0.5">{label}</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={player[field]}
                      onChange={event => updatePlayer(index, field, event.target.value)}
                      onFocus={selectInput}
                      className={STAT_INPUT_CLASS}
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          {activePlayers.length === 0 && (
            <div className="border border-dashed border-[#223046] p-4 text-center text-[11px] font-mono-num text-[#5a6b82]">
              This roster is empty. Add a player or leave it empty.
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-[#223046] mt-4 pt-3">
        <span className={`text-[10px] font-mono-num ${!canSave ? 'text-[#ff334b]' : 'text-[#5a6b82]'}`}>
          {modeMissing
            ? 'Pick a game mode before saving.'
            : emptyNames > 0
              ? `Name every player (${emptyNames} missing).`
              : 'Changes apply to this match only.'}
        </span>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={`flex-1 sm:flex-none px-4 py-1.5 ${THEME_CLASSES.btnGhost} text-xs clip-corner-sm disabled:opacity-50`}
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={!canSave || saving}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-xs clip-corner-sm flex items-center justify-center gap-1.5 transition-all ${
              !canSave || saving
                ? 'opacity-50 cursor-not-allowed bg-[#223046] text-[#7d90a6]'
                : `${THEME_CLASSES.btnPrimary} cursor-pointer`
            }`}
          >
            <Save size={13} />
            <span>{saving ? 'SAVING...' : 'SAVE MATCH'}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
