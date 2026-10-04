import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals for Scrim Graphic & Alias Manager
  const [isAliasModalOpen, setIsAliasModalOpen] = useState(false);
  const [isScrimModalOpen, setIsScrimModalOpen] = useState(false);
  const [scrimMatches, setScrimMatches] = useState([]);

  // Show tactical toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2200);
  }, []);

  const handleOpenScrimModal = (matchesList) => {
    if (!matchesList || matchesList.length === 0) return;
    setScrimMatches(matchesList);
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
    <div className="min-h-screen bg-[#080c14] text-[#f0f4f8] flex flex-col antialiased selection:bg-[#00e5ff]/20 selection:text-[#00e5ff]">
      
      {/* Responsive Unified Sidebar (Desktop persistent + Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={changeTab}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
        isWaking={isWaking}
        wakingMsg={wakingMsg}
        matchCount={matches.length}
        onOpenAliasModal={() => setIsAliasModalOpen(true)}
      />

      {/* Main Content Area: Expanded for Desktop (lg:pl-64 xl:pl-72) */}
      <div className="flex-1 flex flex-col lg:pl-64 xl:pl-72 transition-all">
        <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 pb-10 lg:pb-12">
          
          <Header
            filter={filter}
            onFilterChange={setFilter}
            isWaking={isWaking}
            wakingMsg={wakingMsg}
            onRefresh={loadMatches}
            loading={loading}
            serverError={serverError}
            onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
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
                matches={filteredMatches}
                onUpdateMatch={handleUpdateMatch}
                onDeleteMatch={handleDeleteMatch}
                onOpenScrimModal={handleOpenScrimModal}
              />
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
                <button
                  type="button"
                  onClick={() => setIsAliasModalOpen(true)}
                  className="px-2.5 py-1 bg-[#111723] hover:bg-[#161e2e] border border-[#354b6d] hover:border-[#ffb800] text-[#ffb800] text-xs font-display flex items-center gap-1.5 transition-all clip-corner-sm cursor-pointer shadow-[0_0_8px_rgba(255,184,0,0.15)]"
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


      <Toast message={toastMessage} />
    </div>
  );
}
