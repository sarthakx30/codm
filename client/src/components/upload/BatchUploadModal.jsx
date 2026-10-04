import React, { useState, useRef } from 'react';
import { api } from '../../api/client';
import { parseTier } from '../../engine/playerAnalytics';
import { UploadCloud, CheckCircle2, AlertTriangle, XCircle, ArrowRight, UserMinus } from 'lucide-react';

function shrinkImage(file) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 2000 / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', 0.88);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

export default function BatchUploadModal({ onMatchSaved, showToast }) {
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    const fileList = Array.from(files);
    if (!fileList.length) return;

    const initialQueue = fileList.map((f, i) => ({
      idx: i,
      file: f,
      name: f.name,
      status: 'wait', // 'wait' | 'proc' | 'ready' | 'err' | 'saved'
      match: null,
      duplicate: false,
      error: null
    }));

    setQueue(initialQueue);
    setQueueIndex(0);

    // Process queue sequentially
    for (let i = 0; i < initialQueue.length; i++) {
      setQueue(prev => prev.map((q, idx) => idx === i ? { ...q, status: 'proc' } : q));

      try {
        const shrunkBlob = await shrinkImage(fileList[i]);
        const response = await api.parseScreenshot(shrunkBlob);
        setQueue(prev => prev.map((q, idx) => idx === i ? {
          ...q,
          status: 'ready',
          match: response.match,
          duplicate: response.duplicate
        } : q));
      } catch (err) {
        setQueue(prev => prev.map((q, idx) => idx === i ? {
          ...q,
          status: 'err',
          error: err.message
        } : q));
      }
    }
  };

  const cur = queue[queueIndex];

  const advanceQueue = () => {
    const nextIdx = queue.findIndex((q, i) => i > queueIndex && q.status !== 'saved');
    if (nextIdx !== -1) {
      setQueueIndex(nextIdx);
    } else {
      const anyUnsaved = queue.findIndex(q => q.status !== 'saved');
      if (anyUnsaved !== -1) {
        setQueueIndex(anyUnsaved);
      } else {
        setQueue([]);
        setQueueIndex(0);
        showToast('All batch matches saved.');
      }
    }
  };

  const handlePlayerChange = (playerIdx, field, val) => {
    if (!cur || !cur.match) return;
    const newUs = [...cur.match.us];
    newUs[playerIdx] = { ...newUs[playerIdx], [field]: val };
    const updatedMatch = { ...cur.match, us: newUs };
    setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updatedMatch } : q));
  };

  const handleRemovePlayer = (playerIdx) => {
    if (!cur || !cur.match) return;
    const newUs = cur.match.us.filter((_, idx) => idx !== playerIdx);
    const updatedMatch = { ...cur.match, us: newUs };
    setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updatedMatch } : q));
  };

  const handleSaveCurrent = async () => {
    if (!cur || !cur.match) return;
    try {
      const renames = {};
      cur.match.us.forEach(p => {
        if (p._originalName && p.name !== p._originalName) {
          renames[p._originalName] = p.name;
        }
      });

      await api.saveMatch(cur.match, renames);
      showToast('Match saved.');
      if (onMatchSaved) onMatchSaved();

      setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, status: 'saved' } : q));
      advanceQueue();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  return (
    <div className="mb-10">
      <h2 className="text-lg font-display text-white flex items-center gap-2 mb-2">
        <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
        ADD MATCH // SCREENSHOT OCR
      </h2>

      {/* File Dropzone */}
      <div className="bg-[#111723] border-2 border-dashed border-[#354b6d] hover:border-[#00e5ff] transition-colors p-6 text-center clip-corner-sm mb-4">
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          multiple
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />
        <UploadCloud size={36} className="mx-auto text-[#00e5ff] mb-2 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]" />
        <p className="font-display text-lg text-white font-bold mb-1">SELECT SCREENSHOT(S)</p>
        <p className="text-xs text-[#7d90a6] font-mono-num mb-3">
          Upload one or multiple end-game Match Details scoreboard images
        </p>
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="px-5 py-2 bg-[#00e5ff] text-[#080c14] font-display font-bold text-sm clip-corner-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.3)]"
        >
          CHOOSE FILES
        </button>
      </div>

      {/* Batch Navigation Chips */}
      {queue.length > 1 && (
        <div className="bg-[#111723] border border-[#223046] p-3 mb-4 clip-corner-sm">
          <div className="flex items-center justify-between text-xs font-mono-num text-[#7d90a6] mb-2">
            <span className="text-[#00e5ff] font-display font-bold text-sm">
              BATCH REVIEW ({queue.filter(q => q.status === 'saved').length}/{queue.length} SAVED)
            </span>
            <span>MATCH {queueIndex + 1} OF {queue.length}</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {queue.map((q, idx) => {
              const isActive = idx === queueIndex;
              return (
                <button
                  key={idx}
                  onClick={() => setQueueIndex(idx)}
                  className={`px-2.5 py-1 text-xs font-mono-num border whitespace-nowrap transition-all flex items-center gap-1 ${
                    isActive
                      ? 'border-[#ffb800] text-white bg-[#ffb800]/15'
                      : q.status === 'saved'
                      ? 'border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10'
                      : q.status === 'err'
                      ? 'border-[#ff334b] text-[#ff334b]'
                      : 'border-[#223046] text-[#7d90a6] bg-[#080c14]'
                  }`}
                >
                  <span>#{idx + 1}</span>
                  {q.status === 'saved' && <CheckCircle2 size={11} />}
                  {q.status === 'err' && <XCircle size={11} />}
                  {q.status === 'ready' && q.duplicate && <AlertTriangle size={11} className="text-[#ffb800]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Queue Review Item */}
      {cur && (
        <div className="bg-[#111723] border border-[#223046] p-4 clip-corner shadow-xl">
          {cur.status === 'proc' && (
            <div className="text-center py-8">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-[#00e5ff] border-t-transparent animate-spin mb-2"></span>
              <p className="font-display text-lg text-[#00e5ff] animate-pulse">
                ANALYZING SCREENSHOT #{queueIndex + 1}...
              </p>
            </div>
          )}

          {cur.status === 'err' && (
            <div className="text-center py-6">
              <p className="text-sm font-bold text-[#ff334b] mb-4">FAILED: {cur.error}</p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={advanceQueue}
                  className="px-4 py-1.5 bg-transparent border border-[#354b6d] text-white font-display text-sm hover:border-white"
                >
                  SKIP
                </button>
                <button
                  type="button"
                  onClick={() => setQueue([])}
                  className="px-4 py-1.5 border border-[#ff334b] text-[#ff334b] font-display text-sm"
                >
                  CANCEL ALL
                </button>
              </div>
            </div>
          )}

          {cur.status === 'saved' && (
            <div className="text-center py-6">
              <p className="font-display text-xl text-[#22c55e] font-bold mb-3">✓ SAVED SUCCESSFULLY</p>
              <button
                type="button"
                onClick={advanceQueue}
                className="px-6 py-1.5 bg-[#00e5ff] text-[#080c14] font-display font-bold text-sm clip-corner-sm"
              >
                NEXT MATCH <ArrowRight size={13} className="inline ml-1" />
              </button>
            </div>
          )}

          {cur.status === 'ready' && cur.match && (
            <div className="space-y-4">
              {/* Duplicate alert */}
              {cur.duplicate && (
                <div className="bg-[#ffb800]/15 border border-[#ffb800] text-[#ffb800] p-2 text-xs font-mono-num flex items-center gap-2 rounded">
                  <AlertTriangle size={15} />
                  <span>DUPLICATE DETECTED: This match already exists in the database.</span>
                </div>
              )}

              {/* Score and Result Header */}
              <div className="bg-[#161e2e] border border-[#223046] p-3 clip-corner-sm flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={cur.match.result}
                    onChange={e => {
                      const updated = { ...cur.match, result: e.target.value };
                      setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updated } : q));
                    }}
                    className="bg-[#080c14] border border-[#354b6d] text-white font-display text-lg px-2.5 py-1 font-bold"
                  >
                    <option value="W">VICTORY</option>
                    <option value="L">DEFEAT</option>
                  </select>
                  <input
                    type="number"
                    value={cur.match.score_us}
                    onChange={e => {
                      const updated = { ...cur.match, score_us: parseInt(e.target.value) || 0 };
                      setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updated } : q));
                    }}
                    className="w-16 bg-[#080c14] border border-[#354b6d] text-white font-mono-num text-center text-xl font-bold py-1"
                  />
                  <span className="text-[#7d90a6] font-bold">-</span>
                  <input
                    type="number"
                    value={cur.match.score_them}
                    onChange={e => {
                      const updated = { ...cur.match, score_them: parseInt(e.target.value) || 0 };
                      setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updated } : q));
                    }}
                    className="w-16 bg-[#080c14] border border-[#354b6d] text-white font-mono-num text-center text-xl font-bold py-1"
                  />
                </div>

                <div className="text-xs font-mono-num text-[#7d90a6]">
                  <span>{cur.match.map} - {cur.match.mode}</span>
                  <span className="ml-2 text-white">[{cur.match.played_at_raw}]</span>
                </div>
              </div>

              {/* Player Roster Editor */}
              <div>
                <div className="text-xs font-display text-[#00e5ff] tracking-wider mb-2 font-bold">
                  SQUAD PLAYERS & STATS
                </div>
                <div className="space-y-2">
                  {cur.match.us.map((p, pIdx) => (
                    <div key={pIdx} className="bg-[#161e2e] border border-[#223046] p-2.5 clip-corner-sm">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <input
                          type="text"
                          value={p.name}
                          onChange={e => handlePlayerChange(pIdx, 'name', e.target.value)}
                          className="flex-1 bg-[#080c14] border border-[#354b6d] text-white text-xs font-bold px-2 py-1"
                        />
                        <button
                          type="button"
                          onClick={() => handlePlayerChange(pIdx, 'mvp', !p.mvp)}
                          className={`px-2 py-0.5 text-xs font-display border cursor-pointer ${
                            p.mvp
                              ? 'bg-[#ffb800] text-black border-[#ffb800] font-bold'
                              : 'bg-transparent text-[#7d90a6] border-[#354b6d]'
                          }`}
                        >
                          MVP
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(pIdx)}
                          className="px-2 py-0.5 text-xs border border-[#ff334b]/40 text-[#ff334b] hover:bg-[#ff334b]/15 cursor-pointer"
                          title="Remove Player"
                        >
                          <UserMinus size={13} />
                        </button>
                      </div>

                      {/* Stat inputs */}
                      <div className="grid grid-cols-6 gap-1 font-mono-num text-center">
                        <div>
                          <span className="block text-[9px] text-[#7d90a6]">SCORE</span>
                          <input
                            type="number"
                            value={p.score}
                            onChange={e => handlePlayerChange(pIdx, 'score', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#080c14] border border-[#354b6d] text-white text-xs text-center py-0.5"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[#7d90a6]">KILLS</span>
                          <input
                            type="number"
                            value={p.kills}
                            onChange={e => handlePlayerChange(pIdx, 'kills', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#080c14] border border-[#354b6d] text-white text-xs text-center py-0.5"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[#7d90a6]">DEATHS</span>
                          <input
                            type="number"
                            value={p.deaths}
                            onChange={e => handlePlayerChange(pIdx, 'deaths', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#080c14] border border-[#354b6d] text-white text-xs text-center py-0.5"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[#7d90a6]">ASSISTS</span>
                          <input
                            type="number"
                            value={p.assists}
                            onChange={e => handlePlayerChange(pIdx, 'assists', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#080c14] border border-[#354b6d] text-white text-xs text-center py-0.5"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[#ffb800]">TIME(S)</span>
                          <input
                            type="number"
                            value={p.time || 0}
                            onChange={e => handlePlayerChange(pIdx, 'time', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#080c14] border border-[#ffb800]/50 text-[#ffb800] text-xs text-center py-0.5"
                          />
                        </div>
                        <div>
                          <span className="block text-[9px] text-[#00e5ff]">IMPACT</span>
                          <input
                            type="number"
                            value={p.impact}
                            onChange={e => handlePlayerChange(pIdx, 'impact', parseInt(e.target.value) || 0)}
                            className="w-full bg-[#080c14] border border-[#00e5ff]/50 text-[#00e5ff] text-xs text-center py-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Metadata (Opponent, Tier, Game Type) */}
              <div className="bg-[#161e2e] border border-[#223046] p-3 clip-corner-sm space-y-2 text-xs font-mono-num">
                <div>
                  <label className="block text-[#7d90a6] mb-1">Opponent Team</label>
                  <input
                    type="text"
                    value={cur.match.opponent || ''}
                    onChange={e => {
                      const updated = { ...cur.match, opponent: e.target.value };
                      setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updated } : q));
                    }}
                    placeholder="e.g. Elevate"
                    className="w-full bg-[#080c14] border border-[#354b6d] text-white px-2.5 py-1.5 rounded-sm"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#7d90a6] mb-1">
                    <span>Opponent Tier</span>
                    <span className="text-[#ffb800] font-bold">Selected: {cur.match.tier || 'None'}</span>
                  </div>
                  {/* Main Tier */}
                  <div className="flex gap-1 mb-1">
                    {['T1', 'T2', 'T3', ''].map(val => {
                      const pt = parseTier(cur.match.tier);
                      const isActive = pt.main === val || (!pt.main && !val);
                      return (
                        <button
                          type="button"
                          key={val}
                          onClick={() => {
                            const newTier = val ? `${val}${pt.sub || 'M'}` : '';
                            const updated = { ...cur.match, tier: newTier };
                            setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updated } : q));
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
                  {/* Subtier */}
                  {parseTier(cur.match.tier).main && (
                    <div className="flex gap-1">
                      {['H', 'M', 'L'].map(sub => {
                        const pt = parseTier(cur.match.tier);
                        const isActive = pt.sub === sub;
                        return (
                          <button
                            type="button"
                            key={sub}
                            onClick={() => {
                              const updated = { ...cur.match, tier: `${pt.main}${sub}` };
                              setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updated } : q));
                            }}
                            className={`flex-1 py-0.5 text-[11px] font-display border ${
                              isActive
                                ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/15'
                                : 'border-[#223046] text-[#7d90a6] bg-[#080c14]'
                            }`}
                          >
                            {sub === 'H' ? 'High' : sub === 'M' ? 'Mid' : 'Low'}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[#7d90a6] mb-1">Match Category</label>
                  <div className="flex gap-1">
                    {['scrim', 'tournament'].map(gt => {
                      const isActive = cur.match.game_type === gt;
                      return (
                        <button
                          type="button"
                          key={gt}
                          onClick={() => {
                            const updated = { ...cur.match, game_type: isActive ? '' : gt };
                            setQueue(prev => prev.map((q, i) => i === queueIndex ? { ...q, match: updated } : q));
                          }}
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
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveCurrent}
                  className="flex-1 py-2 bg-[#00e5ff] text-[#080c14] font-display font-bold text-sm clip-corner-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                >
                  {cur.duplicate ? 'SAVE ANYWAY' : 'SAVE MATCH'}
                </button>
                <button
                  type="button"
                  onClick={advanceQueue}
                  className="px-4 py-2 border border-[#354b6d] text-white font-display text-sm hover:border-white clip-corner-sm cursor-pointer"
                >
                  SKIP
                </button>
                {queue.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    className="px-4 py-2 border border-[#ff334b] text-[#ff334b] hover:bg-[#ff334b]/15 font-display text-sm clip-corner-sm cursor-pointer"
                  >
                    CANCEL ALL
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
