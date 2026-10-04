import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../../api/client';
import {
  Users,
  Tag,
  Plus,
  Trash2,
  Search,
  ArrowRight,
  X,
  Shield,
  AlertCircle,
  Check,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function AliasManagerModal({ isOpen, onClose, matches = [], onAliasesUpdated }) {
  const [aliases, setAliases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('roster'); // 'roster' | 'unmapped'
  const [message, setMessage] = useState(null);

  // Form states for manual mapping
  const [inputRaw, setInputRaw] = useState('');
  const [selectedCanonical, setSelectedCanonical] = useState('');
  const [customCanonical, setCustomCanonical] = useState('');

  // Unmapped player quick-assign targets
  const [unmappedTargets, setUnmappedTargets] = useState({});

  const showFeedback = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const loadAliases = useCallback(async () => {
    setLoading(true);
    try {
      const records = await api.getAliasRecords();
      setAliases(records || []);
    } catch (err) {
      console.error('Failed to load alias records:', err);
      // Fallback to dictionary endpoint if records endpoint has an issue
      try {
        const dict = await api.getAliases();
        const fallbackRecords = Object.entries(dict || {}).map(([raw, canonical]) => ({
          raw_name: raw,
          canonical_name: canonical
        }));
        setAliases(fallbackRecords);
      } catch (e) {
        showFeedback('Could not fetch aliases from server.', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAliases();
    }
  }, [isOpen, loadAliases]);

  // Derived unique canonical players from existing aliases + match records
  const allCanonicalNames = useMemo(() => {
    const set = new Set();
    aliases.forEach(a => {
      if (a.canonical_name) set.add(a.canonical_name.trim());
    });
    // Add known players from our team in match history
    matches.forEach(m => {
      (m.us || []).forEach(p => {
        if (p.name) set.add(p.name.trim());
      });
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [aliases, matches]);

  // Group aliases by canonical name
  const canonicalGroups = useMemo(() => {
    const map = new Map();
    // Pre-populate canonical players
    allCanonicalNames.forEach(c => map.set(c, []));

    aliases.forEach(a => {
      const c = (a.canonical_name || '').trim();
      if (!c) return;
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(a.raw_name);
    });

    return Array.from(map.entries()).map(([canonical, rawList]) => ({
      canonical,
      variants: Array.from(new Set(rawList)).sort()
    }));
  }, [aliases, allCanonicalNames]);

  // Find unmapped names from match history
  const unmappedNamesWithCount = useMemo(() => {
    const rawAliasSet = new Set(aliases.map(a => a.raw_name.toLowerCase().trim()));
    const canonicalSet = new Set(allCanonicalNames.map(c => c.toLowerCase().trim()));
    const counts = new Map();

    matches.forEach(m => {
      (m.us || []).forEach(p => {
        const name = (p.name || '').trim();
        if (!name) return;
        const lower = name.toLowerCase();
        // If not in aliases and not already canonical
        if (!rawAliasSet.has(lower) && !canonicalSet.has(lower)) {
          counts.set(name, (counts.get(name) || 0) + 1);
        }
      });
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [aliases, allCanonicalNames, matches]);

  // Filtered canonical groups
  const filteredGroups = useMemo(() => {
    if (!filterText.trim()) return canonicalGroups;
    const q = filterText.toLowerCase();
    return canonicalGroups.filter(g => {
      if (g.canonical.toLowerCase().includes(q)) return true;
      return g.variants.some(v => v.toLowerCase().includes(q));
    });
  }, [canonicalGroups, filterText]);

  // Add alias handler
  const handleAddAlias = async (raw, canonical) => {
    const cleanRaw = (raw || '').trim();
    const cleanCanonical = (canonical || '').trim();

    if (!cleanRaw || !cleanCanonical) {
      showFeedback('Both raw alias and canonical player name are required.', 'error');
      return;
    }

    if (cleanRaw.toLowerCase() === cleanCanonical.toLowerCase()) {
      showFeedback('Raw alias cannot be identical to canonical name.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.saveAliases({ [cleanRaw]: cleanCanonical });
      // Update local state optimistically
      setAliases(prev => {
        const filtered = prev.filter(a => a.raw_name.toLowerCase() !== cleanRaw.toLowerCase());
        return [...filtered, { raw_name: cleanRaw, canonical_name: cleanCanonical }];
      });
      setInputRaw('');
      setSelectedCanonical('');
      setCustomCanonical('');
      showFeedback(`Mapped "${cleanRaw}" → "${cleanCanonical}"`);
      if (onAliasesUpdated) onAliasesUpdated();
    } catch (err) {
      showFeedback(`Failed to save alias: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete alias handler
  const handleDeleteAlias = async (rawName) => {
    if (!window.confirm(`Unlink alias "${rawName}"? OCR will no longer automatically replace this name.`)) {
      return;
    }

    try {
      await api.deleteAlias(rawName);
      setAliases(prev => prev.filter(a => a.raw_name !== rawName));
      showFeedback(`Removed alias "${rawName}"`);
      if (onAliasesUpdated) onAliasesUpdated();
    } catch (err) {
      showFeedback(`Failed to delete alias: ${err.message}`, 'error');
    }
  };

  // Quick map from unassigned list
  const handleQuickMap = (rawName) => {
    const target = unmappedTargets[rawName];
    if (!target) {
      showFeedback('Please select a target canonical player first.', 'error');
      return;
    }
    handleAddAlias(rawName, target);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0c111a] border border-[#223046] w-full max-w-xl max-h-[90vh] flex flex-col clip-corner shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        
        {/* Header */}
        <div className="p-4 border-b border-[#223046] flex items-center justify-between bg-[#111723]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#ffb800]/10 border border-[#ffb800]/30 flex items-center justify-center text-[#ffb800]">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wider m-0 flex items-center gap-2">
                TEAM ROSTER & ALIAS MANAGER
              </h2>
              <p className="text-[11px] font-mono-num text-[#7d90a6] m-0">
                Automate OCR player tagging & consolidate stats under canonical names
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7d90a6] hover:text-white hover:bg-[#161e2e] transition-colors rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Toast / Alert inside modal */}
        {message && (
          <div
            className={`px-4 py-2 text-xs font-mono-num flex items-center gap-2 ${
              message.type === 'error'
                ? 'bg-[#ff334b]/15 text-[#ff334b] border-b border-[#ff334b]/30'
                : 'bg-[#10b981]/15 text-[#10b981] border-b border-[#10b981]/30'
            }`}
          >
            {message.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* Quick Add Alias Form */}
          <div className="bg-[#111723] border border-[#223046] p-3.5 clip-corner-sm">
            <div className="flex items-center gap-1.5 text-xs font-display text-[#00e5ff] font-bold tracking-wider mb-2.5">
              <Sparkles size={14} />
              <span>MAP NEW ALIAS VARIATION</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs font-mono-num">
              {/* Raw Name Input */}
              <div className="sm:col-span-5">
                <label className="block text-[10px] text-[#7d90a6] uppercase tracking-wider mb-1">
                  Raw OCR / Gamertag
                </label>
                <input
                  type="text"
                  value={inputRaw}
                  onChange={e => setInputRaw(e.target.value)}
                  placeholder="e.g. HZN Spade or spade.exe"
                  className="w-full bg-[#080c14] border border-[#354b6d] focus:border-[#00e5ff] text-white px-2.5 py-1.5 rounded-sm outline-none transition-colors"
                />
              </div>

              {/* Arrow separator */}
              <div className="hidden sm:flex sm:col-span-1 items-center justify-center pt-5 text-[#7d90a6]">
                <ArrowRight size={16} />
              </div>

              {/* Canonical Target */}
              <div className="sm:col-span-4">
                <label className="block text-[10px] text-[#7d90a6] uppercase tracking-wider mb-1">
                  Canonical Player
                </label>
                <select
                  value={selectedCanonical}
                  onChange={e => setSelectedCanonical(e.target.value)}
                  className="w-full bg-[#080c14] border border-[#354b6d] focus:border-[#ffb800] text-white px-2.5 py-1.5 rounded-sm outline-none transition-colors"
                >
                  <option value="">Select Existing Player...</option>
                  {allCanonicalNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="__NEW__">+ Add New Canonical Player</option>
                </select>
                {selectedCanonical === '__NEW__' && (
                  <input
                    type="text"
                    value={customCanonical}
                    onChange={e => setCustomCanonical(e.target.value)}
                    placeholder="Enter Canonical Name"
                    className="w-full mt-1.5 bg-[#080c14] border border-[#ffb800] text-[#ffb800] px-2.5 py-1 rounded-sm outline-none"
                    autoFocus
                  />
                )}
              </div>

              {/* Submit Button */}
              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  disabled={saving || !inputRaw.trim() || (!selectedCanonical && !customCanonical.trim())}
                  onClick={() => {
                    const canonical = selectedCanonical === '__NEW__' ? customCanonical : selectedCanonical;
                    handleAddAlias(inputRaw, canonical);
                  }}
                  className="w-full bg-[#ffb800] hover:bg-[#e0a200] disabled:opacity-40 disabled:pointer-events-none text-black font-display font-bold py-1.5 px-3 rounded-sm flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_10px_rgba(255,184,0,0.2)]"
                >
                  <Plus size={14} />
                  <span>MAP</span>
                </button>
              </div>
            </div>
          </div>

          {/* Subtabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#223046] pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveSubTab('roster')}
                className={`px-3 py-1.5 text-xs font-display tracking-wider border transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'roster'
                    ? 'border-[#ffb800] text-[#ffb800] bg-[#ffb800]/10 font-bold'
                    : 'border-[#223046] text-[#7d90a6] hover:text-white'
                }`}
              >
                <Users size={14} />
                <span>ROSTER DIRECTORY ({allCanonicalNames.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('unmapped')}
                className={`px-3 py-1.5 text-xs font-display tracking-wider border transition-all flex items-center gap-1.5 ${
                  activeSubTab === 'unmapped'
                    ? 'border-[#00e5ff] text-[#00e5ff] bg-[#00e5ff]/10 font-bold'
                    : 'border-[#223046] text-[#7d90a6] hover:text-white'
                }`}
              >
                <Tag size={14} />
                <span>UNMAPPED NAMES ({unmappedNamesWithCount.length})</span>
              </button>
            </div>

            {activeSubTab === 'roster' && (
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-[#7d90a6]" />
                <input
                  type="text"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  placeholder="Filter players or aliases..."
                  className="bg-[#080c14] border border-[#223046] text-white text-xs pl-8 pr-3 py-1 rounded-sm outline-none focus:border-[#354b6d] w-full sm:w-48"
                />
              </div>
            )}
          </div>

          {/* Tab 1: Roster Directory */}
          {activeSubTab === 'roster' && (
            <div className="space-y-2.5">
              {loading ? (
                <div className="text-center py-8 text-[#7d90a6] font-mono-num text-xs flex items-center justify-center gap-2">
                  <RefreshCw size={14} className="animate-spin text-[#00e5ff]" />
                  <span>Loading alias database...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="bg-[#111723] border border-[#223046] p-6 text-center text-[#7d90a6] font-mono-num text-xs">
                  No roster profiles found matching your search.
                </div>
              ) : (
                filteredGroups.map(group => (
                  <div
                    key={group.canonical}
                    className="bg-[#111723] border border-[#223046] p-3 clip-corner-sm hover:border-[#354b6d] transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffb800]" />
                        <span className="font-display font-bold text-white text-sm tracking-wide">
                          {group.canonical}
                        </span>
                        <span className="text-[10px] font-mono-num text-[#7d90a6] bg-[#080c14] px-1.5 py-0.5 rounded border border-[#223046]">
                          {group.variants.length} {group.variants.length === 1 ? 'alias' : 'aliases'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCanonical(group.canonical);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-[11px] font-display text-[#00e5ff] hover:underline flex items-center gap-1"
                      >
                        <Plus size={11} />
                        <span>Add Alias</span>
                      </button>
                    </div>

                    {/* Alias chips */}
                    {group.variants.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {group.variants.map(variant => (
                          <div
                            key={variant}
                            className="bg-[#080c14] border border-[#354b6d]/60 text-xs font-mono-num px-2 py-1 rounded flex items-center gap-1.5 group"
                          >
                            <span className="text-[#f0f4f8]">{variant}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteAlias(variant)}
                              className="text-[#7d90a6] hover:text-[#ff334b] transition-colors p-0.5"
                              title="Delete alias"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] font-mono-num text-[#7d90a6]/70 italic m-0">
                        No aliases mapped yet. OCR will only match exact name "{group.canonical}".
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Unmapped Names Detected in Match History */}
          {activeSubTab === 'unmapped' && (
            <div className="space-y-2">
              <div className="bg-[#111723] border border-[#223046] p-3 text-xs font-mono-num text-[#7d90a6] flex items-start gap-2">
                <Shield size={16} className="text-[#00e5ff] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-white font-bold">Unassigned Match Names:</span> These are gamertags recorded in your match history that haven't been mapped to a canonical player yet. Link them below to combine their stats!
                </div>
              </div>

              {unmappedNamesWithCount.length === 0 ? (
                <div className="bg-[#111723] border border-[#223046] p-6 text-center text-[#10b981] font-mono-num text-xs flex flex-col items-center justify-center gap-2">
                  <Check size={24} />
                  <span>All player names in your match history are canonical or mapped!</span>
                </div>
              ) : (
                unmappedNamesWithCount.map(item => (
                  <div
                    key={item.name}
                    className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono-num"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{item.name}</span>
                      <span className="text-[10px] text-[#ffb800] bg-[#ffb800]/10 px-1.5 py-0.5 rounded border border-[#ffb800]/20">
                        {item.count} {item.count === 1 ? 'match' : 'matches'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={unmappedTargets[item.name] || ''}
                        onChange={e => setUnmappedTargets(prev => ({ ...prev, [item.name]: e.target.value }))}
                        className="bg-[#080c14] border border-[#354b6d] text-white px-2 py-1 rounded-sm text-xs"
                      >
                        <option value="">Select Canonical Player...</option>
                        {allCanonicalNames.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleQuickMap(item.name)}
                        className="bg-[#00e5ff] hover:bg-[#00c8e0] text-[#080c14] font-display font-bold px-2.5 py-1 rounded-sm flex items-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(0,229,255,0.2)]"
                      >
                        <ArrowRight size={12} />
                        <span>LINK</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#223046] bg-[#111723]/90 flex items-center justify-between">
          <div className="text-[11px] font-mono-num text-[#7d90a6]">
            Total Active Aliases: <span className="text-white font-bold">{aliases.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#161e2e] hover:bg-[#223046] border border-[#354b6d] text-white font-display text-xs tracking-wider transition-colors cursor-pointer rounded-sm"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
