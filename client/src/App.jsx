import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/common/Header';
import Navbar from './components/common/Navbar';
import Toast from './components/common/Toast';
import HonorsBanner from './components/overview/HonorsBanner';
import RecordBox from './components/overview/RecordBox';
import TacticalIntel from './components/overview/TacticalIntel';
import MapVetoTable from './components/overview/MapVetoTable';
import TierPerformance from './components/overview/TierPerformance';
import OpponentList from './components/overview/OpponentList';
import SortBar from './components/players/SortBar';
import PlayerCardsGrid from './components/players/PlayerCardsGrid';
import PlayerTableView from './components/players/PlayerTableView';
import MatchList from './components/matches/MatchList';
import BatchUploadModal from './components/upload/BatchUploadModal';

import { api, onServerWakingChange } from './api/client';
import { calculateHonors } from './engine/honors';
import { calculateTacticalIntel } from './engine/tacticalIntel';
import { calculateMapVeto } from './engine/mapVeto';
import { calculatePlayerStats } from './engine/playerAnalytics';
import { calculateTierPerformance, calculateOpponents } from './engine/tierAnalytics';

export default function App() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => window.location.hash.replace('#', '') || 'overview');
  const [filter, setFilter] = useState('');
  const [sortKey, setSortKey] = useState('impact');
  const [viewMode, setViewMode] = useState('cards');
  const [toastMessage, setToastMessage] = useState('');
  const [isWaking, setIsWaking] = useState(false);
  const [wakingMsg, setWakingMsg] = useState('');
  const [serverError, setServerError] = useState(false);

  // Show tactical toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  }, []);

  // Listen for server cold-start waking events
  useEffect(() => {
    const unsub = onServerWakingChange((waking, msg) => {
      setIsWaking(waking);
      setWakingMsg(msg);
    });
    return unsub;
  }, []);

  // Sync hash routing with window location
  useEffect(() => {
    const handleHash = () => {
      const h = window.location.hash.replace('#', '') || 'overview';
      setActiveTab(h);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const changeTab = (tabId) => {
    window.location.hash = tabId;
    setActiveTab(tabId);
    window.scrollTo(0, 0);
  };

  // Fetch matches from API
  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getMatches();
      setMatches(data || []);
      setServerError(false);
    } catch (err) {
      console.error('Failed to load matches:', err);
      setServerError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Handle Match Updates and Deletions
  const handleUpdateMatch = async (id, updates) => {
    try {
      const updated = await api.updateMatch(id, updates);
      setMatches(prev => prev.map(m => m.id === id ? updated : m));
      showToast('Match details updated.');
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    }
  };

  const handleDeleteMatch = async (id) => {
    try {
      await api.deleteMatch(id);
      setMatches(prev => prev.filter(m => m.id !== id));
      showToast('Match deleted.');
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Filtered dataset
  const filteredMatches = useMemo(() => {
    if (!filter) return matches;
    return matches.filter(m => m.game_type === filter);
  }, [matches, filter]);

  // Analytics Computations
  const honors = useMemo(() => calculateHonors(filteredMatches), [filteredMatches]);
  const tacticalIntel = useMemo(() => calculateTacticalIntel(filteredMatches), [filteredMatches]);
  const mapVetoList = useMemo(() => calculateMapVeto(filteredMatches), [filteredMatches]);
  const tierList = useMemo(() => calculateTierPerformance(filteredMatches), [filteredMatches]);
  const opponentList = useMemo(() => calculateOpponents(filteredMatches), [filteredMatches]);

  // Sorted Player Stats
  const playerStats = useMemo(() => {
    const raw = calculatePlayerStats(filteredMatches);
    return raw.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      return (b[sortKey] ?? 0) - (a[sortKey] ?? 0);
    });
  }, [filteredMatches, sortKey]);

  return (
    <div className="max-w-2xl mx-auto px-3.5 py-4 pb-28 min-h-screen">
      <Header
        filter={filter}
        onFilterChange={setFilter}
        isWaking={isWaking}
        wakingMsg={wakingMsg}
        onRefresh={loadMatches}
        loading={loading}
        serverError={serverError}
      />

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <section className="animate-fadeIn">
          <HonorsBanner honors={honors} />
          <RecordBox record={tacticalIntel.record} />
          <TacticalIntel slayMatrix={tacticalIntel.slayMatrix} clutch={tacticalIntel.clutch} />
          <MapVetoTable vetoList={mapVetoList} />
          <TierPerformance tierList={tierList} />
          <OpponentList opponentList={opponentList} />
        </section>
      )}

      {/* PLAYERS TAB */}
      {activeTab === 'players' && (
        <section className="animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display text-white flex items-center gap-2 m-0">
              <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
              PLAYER PERFORMANCE ({playerStats.length})
            </h2>
          </div>
          <SortBar
            sortKey={sortKey}
            onSortChange={setSortKey}
            viewMode={viewMode}
            onViewModeToggle={() => setViewMode(v => v === 'cards' ? 'table' : 'cards')}
          />
          {viewMode === 'cards' ? (
            <PlayerCardsGrid players={playerStats} matches={filteredMatches} />
          ) : (
            <PlayerTableView players={playerStats} sortKey={sortKey} onSortChange={setSortKey} />
          )}
        </section>
      )}

      {/* MATCHES TAB */}
      {activeTab === 'matches' && (
        <section className="animate-fadeIn">
          <MatchList
            matches={filteredMatches}
            onUpdateMatch={handleUpdateMatch}
            onDeleteMatch={handleDeleteMatch}
          />
        </section>
      )}

      {/* ADD MATCH TAB */}
      {activeTab === 'add' && (
        <section className="animate-fadeIn">
          <BatchUploadModal onMatchSaved={loadMatches} showToast={showToast} />
        </section>
      )}

      <Navbar activeTab={activeTab} onTabChange={changeTab} />
      <Toast message={toastMessage} />
    </div>
  );
}
