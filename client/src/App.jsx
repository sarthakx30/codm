import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import MobileNav from './components/common/MobileNav';
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
import MapsTab from './components/maps/MapsTab';
import BatchUploadModal from './components/upload/BatchUploadModal';
import AliasManagerModal from './components/aliases/AliasManagerModal';
import ScrimCardModal from './components/scrim/ScrimCardModal';
import { Users } from 'lucide-react';

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

  // Modals for Scrim Graphic & Alias Manager
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [isScrimModalOpen, setIsScrimModalOpen] = useState(false);
  const [scrimMatches, setScrimMatches] = useState([]);

  // Show tactical toast
  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(''), 2200);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const handleOpenScrimModal = (matchesList) => {
    if (!matchesList || matchesList.length === 0) return;
    const limited = matchesList.length > 5 ? matchesList.slice(0, 5) : matchesList;
    if (matchesList.length > 5) {
      showToast('Select up to 5 maps for a scrim card.');
    }
    setScrimMatches(limited);
    setIsScrimModalOpen(true);
  };

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

  // Handle full match saves and deletions
  const handleSaveFullMatch = async (matchData) => {
    try {
      const saved = await api.saveMatch(matchData);
      setMatches(prev => (
        prev.some(m => m.id === saved.id)
          ? prev.map(m => (m.id === saved.id ? saved : m))
          : [saved, ...prev]
      ));
      showToast('Match updated.');
      return saved;
    } catch (err) {
      showToast(`Save failed: ${err.message}`);
      return null;
    }
  };

  const handleDeleteMatch = async (id) => {
    try {
      await api.deleteMatch(id);
      setMatches(prev => prev.filter(m => m.id !== id));
      showToast('Match deleted.');
    } catch (err) {
      showToast(`Delete failed: ${err.message}`);
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
    <div className="min-h-screen bg-[#080c14] text-[#f0f4f8] flex flex-col antialiased selection:bg-[#f5b700]/30 selection:text-[#ffd700]">
      
      {/* Desktop Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={changeTab}
        isWaking={isWaking}
        wakingMsg={wakingMsg}
        matchCount={matches.length}
        onOpenAliasModal={() => setIsAliasModalOpen(true)}
      />

      {/* Main Content Area: Expanded for Desktop (lg:pl-64 xl:pl-72) */}
      <div className="flex-1 flex flex-col lg:pl-64 xl:pl-72 transition-all">
        <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-5 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-12">
          
          <Header
            filter={filter}
            onFilterChange={setFilter}
            isWaking={isWaking}
            wakingMsg={wakingMsg}
            onRefresh={loadMatches}
            loading={loading}
            serverError={serverError}
            onOpenAliasModal={() => setIsAliasModalOpen(true)}
            showScope={activeTab !== 'add'}
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

          {/* MAPS TAB (NEW) */}
          {activeTab === 'maps' && (
            <section className="animate-fadeIn">
              <MapsTab matches={filteredMatches} />
            </section>
          )}

          {/* MATCHES TAB */}
          {activeTab === 'matches' && (
            <section className="animate-fadeIn">
              <MatchList
                key={filter}
                matches={filteredMatches}
                onSaveMatch={handleSaveFullMatch}
                onDeleteMatch={handleDeleteMatch}
                onOpenScrimModal={handleOpenScrimModal}
                showToast={showToast}
              />
            </section>
          )}

          {/* PLAYERS TAB */}
          {activeTab === 'players' && (
            <section className="animate-fadeIn">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-display text-white flex items-center gap-2 m-0">
                  <span className="w-1 h-3.5 bg-[#f5b700] inline-block"></span>
                  PLAYER PERFORMANCE ({playerStats.length})
                </h2>
                <button
                  type="button"
                  onClick={() => setIsAliasModalOpen(true)}
                  className="px-2.5 py-1 bg-[#111723] hover:bg-[#161e2e] border border-[#354b6d] hover:border-[#f5b700] text-[#f5b700] text-xs font-display flex items-center gap-1.5 transition-all clip-corner-sm cursor-pointer shadow-[0_0_8px_rgba(245,183,0,0.15)]"
                >
                  <Users size={13} />
                  <span>ROSTER & ALIASES</span>
                </button>
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

          {/* ADD MATCH TAB */}
          {activeTab === 'add' && (
            <section className="animate-fadeIn">
              <BatchUploadModal
                matches={matches}
                onMatchSaved={loadMatches}
                showToast={showToast}
                onOpenScrimModal={handleOpenScrimModal}
                onOpenAliasModal={() => setIsAliasModalOpen(true)}
              />
            </section>
          )}

        </main>
      </div>

      {/* MODALS */}
      <AliasManagerModal
        isOpen={isAliasModalOpen}
        onClose={() => setIsAliasModalOpen(false)}
        matches={matches}
        onAliasesUpdated={loadMatches}
      />

      <ScrimCardModal
        isOpen={isScrimModalOpen}
        onClose={() => setIsScrimModalOpen(false)}
        selectedMatches={scrimMatches}
        showToast={showToast}
      />

      <MobileNav activeTab={activeTab} onTabChange={changeTab} />

      <Toast message={toastMessage} />
    </div>
  );
}
