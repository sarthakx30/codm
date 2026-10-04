import React from 'react';
import { Trophy, Crosshair, Shield, Award, Zap } from 'lucide-react';

export default function HonorsBanner({ honors }) {
  if (!honors || (!honors.topPerformer && !honors.topSlayer && !honors.bestObj && !honors.bestSupport && !honors.theClincher)) {
    return null;
  }

  const { topPerformer, topSlayer, bestObj, bestSupport, theClincher } = honors;

  return (
    <div className="mb-6 space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display text-white flex items-center gap-2 m-0">
          <span className="w-1 h-3.5 bg-[#ffb800] inline-block"></span>
          PLAYER HIGHLIGHTS
        </h2>
        <span className="font-mono-num text-[11px] text-[#7d90a6] tracking-wider">// PAST 2 WEEKS</span>
      </div>

      {/* Main Top Performer Card */}
      {topPerformer && (
        <div className="bg-gradient-to-br from-[#ffb800]/15 via-[#111723]/95 to-[#111723] border border-[#ffb800] p-3.5 clip-corner shadow-[0_0_15px_rgba(255,184,0,0.15)]">
          <div className="flex items-center gap-1.5 text-xs font-display font-bold text-[#ffb800] tracking-wider mb-1">
            <Trophy size={14} className="text-[#ffb800]" />
            <span>★ TOP PERFORMER</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-display text-white">{topPerformer.name}</span>
            <span className="font-mono-num text-sm font-bold text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
              {topPerformer.avgImpact} AVG IMPACT
            </span>
          </div>
          <div className="text-xs font-mono-num text-[#7d90a6] mt-0.5">
            {topPerformer.kd} K/D • {topPerformer.games} matches • {topPerformer.winRate}% win rate
          </div>
        </div>
      )}

      {/* 2x2 Sub-Honors Grid */}
      <div className="grid grid-cols-2 gap-2">
        {topSlayer && (
          <div className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm hover:border-[#00e5ff]/50 transition-colors">
            <div className="flex items-center gap-1 text-[11px] font-display font-bold text-[#ffb800] tracking-wider">
              <Crosshair size={12} />
              <span>TOP SLAYER</span>
            </div>
            <div className="text-lg font-bold font-display text-white truncate mt-0.5">{topSlayer.name}</div>
            <div className="font-mono-num text-xs font-bold text-[#00e5ff]">{topSlayer.kpm} Kills/Match</div>
            <div className="font-mono-num text-[11px] text-[#7d90a6]">{topSlayer.kd} K/D</div>
          </div>
        )}

        {bestObj && (
          <div className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm hover:border-[#ffb800]/50 transition-colors">
            <div className="flex items-center gap-1 text-[11px] font-display font-bold text-[#ffb800] tracking-wider">
              <Shield size={12} />
              <span>BEST OBJ</span>
            </div>
            <div className="text-lg font-bold font-display text-white truncate mt-0.5">{bestObj.name}</div>
            <div className="font-mono-num text-xs font-bold text-[#ffb800]">{bestObj.avgTime}s Avg Hill Time</div>
            <div className="font-mono-num text-[11px] text-[#7d90a6]">{bestObj.hpGames} Hardpoint games</div>
          </div>
        )}

        {bestSupport && (
          <div className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm hover:border-[#00e5ff]/50 transition-colors">
            <div className="flex items-center gap-1 text-[11px] font-display font-bold text-[#ffb800] tracking-wider">
              <Award size={12} />
              <span>BEST SUPPORT</span>
            </div>
            <div className="text-lg font-bold font-display text-white truncate mt-0.5">{bestSupport.name}</div>
            <div className="font-mono-num text-xs font-bold text-[#00e5ff]">{bestSupport.apm} Assists/Match</div>
            <div className="font-mono-num text-[11px] text-[#7d90a6]">{bestSupport.avgScore} Avg Score</div>
          </div>
        )}

        {theClincher && (
          <div className="bg-[#111723] border border-[#223046] p-2.5 clip-corner-sm hover:border-[#ffb800]/50 transition-colors">
            <div className="flex items-center gap-1 text-[11px] font-display font-bold text-[#ffb800] tracking-wider">
              <Zap size={12} />
              <span>THE CLINCHER</span>
            </div>
            <div className="text-lg font-bold font-display text-white truncate mt-0.5">{theClincher.name}</div>
            <div className="font-mono-num text-xs font-bold text-[#ffb800]">{theClincher.mvpRate}% MVP Rate</div>
            <div className="font-mono-num text-[11px] text-[#7d90a6]">{theClincher.mvps} MVPs in {theClincher.games} games</div>
          </div>
        )}
      </div>
    </div>
  );
}
