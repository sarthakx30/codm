import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  X,
  Sparkles,
  Trophy,
  Swords,
  Flame,
  Calendar,
  Layers
} from 'lucide-react';

export default function ScrimCardModal({
  isOpen,
  onClose,
  selectedMatches = [],
  showToast
}) {
  const canvasRef = useRef(null);

  // Editable card metadata
  const [teamName, setTeamName] = useState('HORIZON');
  const [opponentName, setOpponentName] = useState('');
  const [seriesTitle, setSeriesTitle] = useState('OFFICIAL TACTICAL SCRIM');
  const [seriesFormat, setSeriesFormat] = useState('BEST OF 3');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Initialize opponent name when selected matches change
  useEffect(() => {
    if (selectedMatches.length > 0) {
      const opp = selectedMatches.find(m => m.opponent)?.opponent || 'OPPONENT';
      setOpponentName(opp);
      if (selectedMatches.length === 3) setSeriesFormat('BEST OF 3');
      else if (selectedMatches.length === 5) setSeriesFormat('BEST OF 5');
      else setSeriesFormat(`SERIES (${selectedMatches.length} MAPS)`);
    }
  }, [selectedMatches]);

  // Aggregate stats across selected matches
  const { wins, losses, mapProgression, squadStats, seriesMvp } = useMemo(() => {
    let w = 0;
    let l = 0;
    const playerMap = new Map();

    const progression = selectedMatches.map((m, idx) => {
      const isWin = m.result === 'W';
      if (isWin) w++;
      else l++;

      // Find top scorer or MVP for this map
      const mapPlayers = (m.us || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0));
      const topPlayer = mapPlayers[0] || { name: 'N/A', kills: 0 };

      // Aggregate squad stats
      (m.us || []).forEach(p => {
        const name = (p.name || 'Unknown').trim();
        const existing = playerMap.get(name) || {
          name,
          maps: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          score: 0,
          impact: 0,
          time: 0,
          mvps: 0
        };
        existing.maps += 1;
        existing.kills += (p.kills || 0);
        existing.deaths += (p.deaths || 0);
        existing.assists += (p.assists || 0);
        existing.score += (p.score || 0);
        existing.impact += (p.impact || 0);
        existing.time += (p.time || 0);
        if (p.mvp) existing.mvps += 1;
        playerMap.set(name, existing);
      });

      return {
        gameNum: idx + 1,
        mode: m.mode || 'HARDPOINT',
        map: m.map || 'MAP',
        scoreUs: m.score_us || 0,
        scoreThem: m.score_them || 0,
        result: isWin ? 'WIN' : 'LOSS',
        topPlayerName: topPlayer.name,
        topPlayerKills: topPlayer.kills || 0
      };
    });

    const squad = Array.from(playerMap.values()).map(p => ({
      ...p,
      kd: p.deaths > 0 ? (p.kills / p.deaths).toFixed(2) : p.kills.toFixed(2),
      avgImpact: Math.round(p.impact / p.maps),
      avgScore: Math.round(p.score / p.maps)
    })).sort((a, b) => b.score - a.score);

    const mvp = squad[0] || null;

    return {
      wins: w,
      losses: l,
      mapProgression: progression,
      squadStats: squad,
      seriesMvp: mvp
    };
  }, [selectedMatches]);

  // Render high-res graphic to Canvas
  const drawGraphic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 2400;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;

    // 1. Background deep gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#06090e');
    bgGrad.addColorStop(0.5, '#0b121e');
    bgGrad.addColorStop(1, '#05070b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle tactical grid lines
    ctx.strokeStyle = 'rgba(34, 48, 70, 0.25)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < W; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Glowing corner accents & decorative border
    const isSeriesWin = wins > losses;
    const accentColor = isSeriesWin ? '#00e5ff' : '#ff334b';
    const goldColor = '#ffb800';

    ctx.strokeStyle = 'rgba(53, 75, 109, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Angular bracket corners
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 6;
    const bracketSize = 50;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(35, 35 + bracketSize);
    ctx.lineTo(35, 35);
    ctx.lineTo(35 + bracketSize, 35);
    ctx.stroke();
    // Top-Right
    ctx.beginPath();
    ctx.moveTo(W - 35 - bracketSize, 35);
    ctx.lineTo(W - 35, 35);
    ctx.lineTo(W - 35, 35 + bracketSize);
    ctx.stroke();
    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(35, H - 35 - bracketSize);
    ctx.lineTo(35, H - 35);
    ctx.lineTo(35 + bracketSize, H - 35);
    ctx.stroke();
    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(W - 35 - bracketSize, H - 35);
    ctx.lineTo(W - 35, H - 35);
    ctx.lineTo(W - 35, H - 35 - bracketSize);
    ctx.stroke();

    // ==========================================
    // 2. HEADER SECTION
    // ==========================================
    // Top Brand Tag
    ctx.fillStyle = goldColor;
    ctx.font = '700 24px "Share Tech Mono", monospace';
    ctx.fillText('// HORIZON ESPORTS TACTICAL DIVISION', 80, 95);

    ctx.fillStyle = '#7d90a6';
    ctx.font = '600 22px "Share Tech Mono", monospace';
    const dateStr = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).toUpperCase();
    ctx.textAlign = 'right';
    ctx.fillText(`DATE: ${dateStr}  |  ${seriesFormat.toUpperCase()}`, W - 80, 95);
    ctx.textAlign = 'left';

    // Divider line
    ctx.strokeStyle = 'rgba(53, 75, 109, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, 115);
    ctx.lineTo(W - 80, 115);
    ctx.stroke();

    // Event Subtitle
    ctx.fillStyle = '#7d90a6';
    ctx.font = '700 26px "Rajdhani", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText(seriesTitle.toUpperCase(), 80, 155);

    // Big Matchup Banner: [TEAM] VS [OPPONENT]
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 84px "Teko", sans-serif';
    ctx.fillText(teamName.toUpperCase(), 80, 235);

    const teamWidth = ctx.measureText(teamName.toUpperCase()).width;
    ctx.fillStyle = goldColor;
    ctx.font = '700 52px "Teko", sans-serif';
    ctx.fillText('VS', 80 + teamWidth + 24, 235);

    const vsWidth = ctx.measureText('VS').width;
    ctx.fillStyle = '#a0aec0';
    ctx.font = '800 84px "Teko", sans-serif';
    ctx.fillText((opponentName || 'OPPONENT').toUpperCase(), 80 + teamWidth + 24 + vsWidth + 24, 235);

    // Big Series Score Badge on Right
    const outcomeText = isSeriesWin ? 'VICTORY' : wins === losses ? 'DRAW' : 'DEFEAT';
    const scoreText = `${wins} - ${losses}`;

    ctx.textAlign = 'right';
    ctx.fillStyle = accentColor;
    ctx.font = '700 40px "Rajdhani", sans-serif';
    ctx.fillText(outcomeText, W - 80, 175);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 110px "Teko", sans-serif';
    ctx.fillText(scoreText, W - 80, 255);
    ctx.textAlign = 'left';

    // ==========================================
    // 3. MAP PROGRESSION SECTION (HORIZONTAL CARDS)
    // ==========================================
    const mapY = 280;
    const mapH = 160;
    const mapCount = mapProgression.length;
    const totalMapW = W - 160;
    const gap = 20;
    const cardW = (totalMapW - (mapCount - 1) * gap) / mapCount;

    mapProgression.forEach((m, idx) => {
      const cardX = 80 + idx * (cardW + gap);
      const isWin = m.result === 'WIN';
      const mAccent = isWin ? '#00e5ff' : '#ff334b';

      // Card BG
      ctx.fillStyle = '#111723';
      ctx.fillRect(cardX, mapY, cardW, mapH);

      // Card Border & Left Result Stripe
      ctx.strokeStyle = 'rgba(53, 75, 109, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX, mapY, cardW, mapH);

      ctx.fillStyle = mAccent;
      ctx.fillRect(cardX, mapY, 6, mapH);

      // Map # & Result Badge
      ctx.fillStyle = '#7d90a6';
      ctx.font = '700 18px "Share Tech Mono", monospace';
      ctx.fillText(`MAP ${m.gameNum}`, cardX + 20, mapY + 30);

      // Result Pill
      ctx.fillStyle = isWin ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 51, 75, 0.15)';
      ctx.fillRect(cardX + cardW - 75, mapY + 12, 60, 24);
      ctx.strokeStyle = mAccent;
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX + cardW - 75, mapY + 12, 60, 24);
      ctx.fillStyle = mAccent;
      ctx.font = '700 14px "Rajdhani", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.result, cardX + cardW - 45, mapY + 29);
      ctx.textAlign = 'left';

      // Mode & Map Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 28px "Teko", sans-serif';
      ctx.fillText(`${m.map.toUpperCase()}`, cardX + 20, mapY + 68);

      ctx.fillStyle = '#7d90a6';
      ctx.font = '600 17px "Rajdhani", sans-serif';
      ctx.fillText(m.mode.toUpperCase(), cardX + 20, mapY + 92);

      // Score
      ctx.fillStyle = isWin ? '#00e5ff' : '#f0f4f8';
      ctx.font = '700 36px "Teko", sans-serif';
      ctx.fillText(`${m.scoreUs} - ${m.scoreThem}`, cardX + 20, mapY + 135);

      // Map Top Performer
      ctx.fillStyle = '#7d90a6';
      ctx.font = '500 15px "Share Tech Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`MVP: ${m.topPlayerName}`, cardX + cardW - 15, mapY + 135);
      ctx.textAlign = 'left';
    });

    // ==========================================
    // 4. SQUAD STATS TABLE + SERIES MVP SPOTLIGHT
    // ==========================================
    const tableY = 475;
    const tableW = 1580;
    const spotlightX = 80 + tableW + 30;
    const spotlightW = W - 80 - spotlightX;
    const tableH = H - tableY - 110;

    // --- LEFT: SQUAD STATS TABLE ---
    ctx.fillStyle = '#0c111a';
    ctx.fillRect(80, tableY, tableW, tableH);
    ctx.strokeStyle = 'rgba(53, 75, 109, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(80, tableY, tableW, tableH);

    // Table Header Bar
    ctx.fillStyle = '#161e2e';
    ctx.fillRect(80, tableY, tableW, 55);

    ctx.fillStyle = goldColor;
    ctx.font = '700 22px "Rajdhani", sans-serif';
    ctx.fillText('AGGREGATE SQUAD PERFORMANCE', 105, tableY + 36);

    // Columns
    const cols = [
      { label: 'PLAYER', x: 105, w: 320, align: 'left' },
      { label: 'MAPS', x: 440, w: 90, align: 'center' },
      { label: 'KILLS', x: 550, w: 110, align: 'center' },
      { label: 'DEATHS', x: 670, w: 110, align: 'center' },
      { label: 'K/D RATIO', x: 800, w: 130, align: 'center' },
      { label: 'ASSISTS', x: 940, w: 100, align: 'center' },
      { label: 'TOTAL OBJ', x: 1060, w: 130, align: 'center' },
      { label: 'TOTAL SCORE', x: 1210, w: 150, align: 'center' },
      { label: 'AVG IMPACT', x: 1380, w: 140, align: 'center' }
    ];

    ctx.font = '700 15px "Share Tech Mono", monospace';
    ctx.fillStyle = '#7d90a6';
    cols.forEach(c => {
      ctx.textAlign = c.align;
      ctx.fillText(c.label, c.x, tableY + 36);
    });
    ctx.textAlign = 'left';

    // Squad Player Rows
    const rowH = 68;
    const displaySquad = squadStats.slice(0, 7);

    displaySquad.forEach((p, idx) => {
      const rY = tableY + 55 + idx * rowH;
      const isTop = idx === 0;

      // Alternating row background
      if (idx % 2 === 1) {
        ctx.fillStyle = 'rgba(22, 30, 46, 0.4)';
        ctx.fillRect(80, rY, tableW, rowH);
      }

      // Divider line
      ctx.strokeStyle = 'rgba(34, 48, 70, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, rY + rowH);
      ctx.lineTo(80 + tableW, rY + rowH);
      ctx.stroke();

      // Top MVP highlight strip
      if (isTop) {
        ctx.fillStyle = goldColor;
        ctx.fillRect(80, rY, 4, rowH);
      }

      // 1. Player Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 24px "Rajdhani", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(p.name, 105, rY + 42);

      if (isTop) {
        ctx.fillStyle = goldColor;
        ctx.font = '700 12px "Share Tech Mono", monospace';
        ctx.fillText('★ SERIES MVP', 105, rY + 60);
      }

      // 2. Maps
      ctx.fillStyle = '#7d90a6';
      ctx.font = '600 20px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(p.maps.toString(), 440, rY + 43);

      // 3. Kills
      ctx.fillStyle = '#00e5ff';
      ctx.font = '700 26px "Teko", sans-serif';
      ctx.fillText(p.kills.toString(), 550, rY + 43);

      // 4. Deaths
      ctx.fillStyle = '#ff7b88';
      ctx.font = '700 26px "Teko", sans-serif';
      ctx.fillText(p.deaths.toString(), 670, rY + 43);

      // 5. K/D Ratio
      const kdNum = parseFloat(p.kd);
      ctx.fillStyle = kdNum >= 1.5 ? goldColor : kdNum >= 1.0 ? '#00e5ff' : '#a0aec0';
      ctx.font = '700 26px "Teko", sans-serif';
      ctx.fillText(p.kd, 800, rY + 43);

      // 6. Assists
      ctx.fillStyle = '#7d90a6';
      ctx.font = '600 20px "Share Tech Mono", monospace';
      ctx.fillText(p.assists.toString(), 940, rY + 43);

      // 7. OBJ Time (formatted mm:ss or s)
      const objFormatted = p.time > 60
        ? `${Math.floor(p.time / 60)}m ${p.time % 60}s`
        : `${p.time}s`;
      ctx.fillStyle = goldColor;
      ctx.font = '600 20px "Share Tech Mono", monospace';
      ctx.fillText(objFormatted, 1060, rY + 43);

      // 8. Total Score
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 26px "Teko", sans-serif';
      ctx.fillText(p.score.toLocaleString(), 1210, rY + 43);

      // 9. Avg Impact
      ctx.fillStyle = '#00e5ff';
      ctx.font = '700 26px "Teko", sans-serif';
      ctx.fillText(p.avgImpact.toString(), 1380, rY + 43);
    });

    // --- RIGHT: SERIES MVP SPOTLIGHT CARD ---
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111723';
    ctx.fillRect(spotlightX, tableY, spotlightW, tableH);

    ctx.strokeStyle = goldColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(spotlightX, tableY, spotlightW, tableH);

    // Glow effect header
    ctx.fillStyle = 'rgba(255, 184, 0, 0.12)';
    ctx.fillRect(spotlightX, tableY, spotlightW, 60);

    ctx.fillStyle = goldColor;
    ctx.font = '800 24px "Rajdhani", sans-serif';
    ctx.fillText('★ SERIES MVP SPOTLIGHT', spotlightX + 30, tableY + 40);

    if (seriesMvp) {
      // Big MVP Player Name
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 56px "Teko", sans-serif';
      ctx.fillText(seriesMvp.name.toUpperCase(), spotlightX + 30, tableY + 130);

      ctx.fillStyle = '#7d90a6';
      ctx.font = '700 18px "Share Tech Mono", monospace';
      ctx.fillText(`PLAYED ALL ${seriesMvp.maps} MAPS IN SERIES`, spotlightX + 30, tableY + 160);

      // Stat Highlights Grid
      const statBoxY = tableY + 185;
      const statBoxW = (spotlightW - 60 - 20) / 2;
      const statBoxH = 110;

      // Box 1: Series Kills
      ctx.fillStyle = '#0c111a';
      ctx.fillRect(spotlightX + 30, statBoxY, statBoxW, statBoxH);
      ctx.strokeStyle = 'rgba(53, 75, 109, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(spotlightX + 30, statBoxY, statBoxW, statBoxH);

      ctx.fillStyle = '#7d90a6';
      ctx.font = '700 14px "Share Tech Mono", monospace';
      ctx.fillText('TOTAL KILLS', spotlightX + 45, statBoxY + 30);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '800 52px "Teko", sans-serif';
      ctx.fillText(seriesMvp.kills.toString(), spotlightX + 45, statBoxY + 85);

      // Box 2: Series K/D
      ctx.fillStyle = '#0c111a';
      ctx.fillRect(spotlightX + 30 + statBoxW + 20, statBoxY, statBoxW, statBoxH);
      ctx.strokeRect(spotlightX + 30 + statBoxW + 20, statBoxY, statBoxW, statBoxH);

      ctx.fillStyle = '#7d90a6';
      ctx.font = '700 14px "Share Tech Mono", monospace';
      ctx.fillText('SERIES K/D', spotlightX + 45 + statBoxW + 20, statBoxY + 30);

      ctx.fillStyle = goldColor;
      ctx.font = '800 52px "Teko", sans-serif';
      ctx.fillText(seriesMvp.kd, spotlightX + 45 + statBoxW + 20, statBoxY + 85);

      // Box 3: Total Score
      const statBoxY2 = statBoxY + statBoxH + 20;
      ctx.fillStyle = '#0c111a';
      ctx.fillRect(spotlightX + 30, statBoxY2, statBoxW, statBoxH);
      ctx.strokeRect(spotlightX + 30, statBoxY2, statBoxW, statBoxH);

      ctx.fillStyle = '#7d90a6';
      ctx.font = '700 14px "Share Tech Mono", monospace';
      ctx.fillText('COMBINED SCORE', spotlightX + 45, statBoxY2 + 30);

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 52px "Teko", sans-serif';
      ctx.fillText(seriesMvp.score.toLocaleString(), spotlightX + 45, statBoxY2 + 85);

      // Box 4: Avg Impact
      ctx.fillStyle = '#0c111a';
      ctx.fillRect(spotlightX + 30 + statBoxW + 20, statBoxY2, statBoxW, statBoxH);
      ctx.strokeRect(spotlightX + 30 + statBoxW + 20, statBoxY2, statBoxW, statBoxH);

      ctx.fillStyle = '#7d90a6';
      ctx.font = '700 14px "Share Tech Mono", monospace';
      ctx.fillText('AVG IMPACT', spotlightX + 45 + statBoxW + 20, statBoxY2 + 30);

      ctx.fillStyle = '#00e5ff';
      ctx.font = '800 52px "Teko", sans-serif';
      ctx.fillText(seriesMvp.avgImpact.toString(), spotlightX + 45 + statBoxW + 20, statBoxY2 + 85);

      // MVP Quote / Tactical Stamp
      ctx.fillStyle = 'rgba(255, 184, 0, 0.08)';
      ctx.fillRect(spotlightX + 30, statBoxY2 + statBoxH + 25, spotlightW - 60, 70);
      ctx.strokeStyle = 'rgba(255, 184, 0, 0.3)';
      ctx.strokeRect(spotlightX + 30, statBoxY2 + statBoxH + 25, spotlightW - 60, 70);

      ctx.fillStyle = goldColor;
      ctx.font = '700 16px "Share Tech Mono", monospace';
      ctx.fillText('DOMINANT SQUAD CARRY // APEX FRAGGER', spotlightX + 45, statBoxY2 + statBoxH + 65);
    }

    // ==========================================
    // 5. FOOTER
    // ==========================================
    ctx.fillStyle = '#7d90a6';
    ctx.font = '600 16px "Share Tech Mono", monospace';
    ctx.fillText('CODM TACTICAL ANALYTICS ENGINE // TOURNAMENT & SCRIM VERIFIED REPORT', 80, H - 55);

    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(125, 144, 166, 0.6)';
    ctx.fillText('POWERED BY HORIZON TRACKER', W - 80, H - 55);
    ctx.textAlign = 'left';
  };

  // Re-draw when options or matches change
  useEffect(() => {
    if (!isOpen || selectedMatches.length === 0) return;
    // Ensure Google fonts are ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        drawGraphic();
      });
    } else {
      drawGraphic();
    }
  }, [isOpen, selectedMatches, teamName, opponentName, seriesTitle, seriesFormat, wins, losses, squadStats, seriesMvp]);

  // Download High-Res PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const cleanOpp = (opponentName || 'opponent').toLowerCase().replace(/\s+/g, '_');
      link.download = `scrim_series_${teamName.toLowerCase()}_vs_${cleanOpp}.png`;
      link.href = dataUrl;
      link.click();
      if (showToast) showToast('High-Res Scrim Card Downloaded.');
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Copy Image to Clipboard for Instant Discord / Twitter Paste
  const handleCopyClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
          if (showToast) showToast('Graphic copied to clipboard! Paste directly into Discord.');
        } catch (clipErr) {
          // If browser restricts direct image clipboard write, fallback
          console.warn('Clipboard write failed:', clipErr);
          alert('Clipboard write was blocked by browser. Please use the Download button instead.');
        }
      }, 'image/png');
    } catch (err) {
      alert(`Copy failed: ${err.message}`);
    }
  };

  if (!isOpen || selectedMatches.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0c111a] border border-[#223046] w-full max-w-5xl max-h-[92vh] flex flex-col clip-corner shadow-[0_0_60px_rgba(0,0,0,0.9)] relative">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-[#223046] flex items-center justify-between bg-[#111723]/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
              <Swords size={18} />
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-white tracking-wider m-0 flex items-center gap-2">
                SCRIM SERIES GRAPHIC GENERATOR
                <span className="text-[10px] font-mono-num bg-[#ffb800]/15 text-[#ffb800] px-1.5 py-0.5 rounded border border-[#ffb800]/30">
                  {selectedMatches.length} MAPS
                </span>
              </h2>
              <p className="text-[11px] font-mono-num text-[#7d90a6] m-0">
                Generate high-resolution Discord & Twitter esports summary cards
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

        {/* Modal Body: Controls & Canvas Preview */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* Customization Bar */}
          <div className="bg-[#111723] border border-[#223046] p-3 clip-corner-sm grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono-num">
            <div>
              <label className="block text-[10px] text-[#7d90a6] uppercase tracking-wider mb-1">
                Our Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                className="w-full bg-[#080c14] border border-[#354b6d] focus:border-[#ffb800] text-white px-2.5 py-1.5 rounded-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#7d90a6] uppercase tracking-wider mb-1">
                Opponent Clan / Team
              </label>
              <input
                type="text"
                value={opponentName}
                onChange={e => setOpponentName(e.target.value)}
                placeholder="e.g. Elevate or Enigma"
                className="w-full bg-[#080c14] border border-[#354b6d] focus:border-[#00e5ff] text-white px-2.5 py-1.5 rounded-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#7d90a6] uppercase tracking-wider mb-1">
                Series Title / Event
              </label>
              <input
                type="text"
                value={seriesTitle}
                onChange={e => setSeriesTitle(e.target.value)}
                placeholder="e.g. STAGE 4 SCRIM #1"
                className="w-full bg-[#080c14] border border-[#354b6d] focus:border-[#00e5ff] text-white px-2.5 py-1.5 rounded-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#7d90a6] uppercase tracking-wider mb-1">
                Format
              </label>
              <select
                value={seriesFormat}
                onChange={e => setSeriesFormat(e.target.value)}
                className="w-full bg-[#080c14] border border-[#354b6d] focus:border-[#ffb800] text-white px-2.5 py-1.5 rounded-sm outline-none"
              >
                <option value="BEST OF 3">BEST OF 3 (BO3)</option>
                <option value="BEST OF 5">BEST OF 5 (BO5)</option>
                <option value="SCRIM SERIES">SCRIM SERIES</option>
                <option value="TOURNAMENT MATCH">TOURNAMENT MATCH</option>
              </select>
            </div>
          </div>

          {/* Interactive Canvas Preview */}
          <div className="bg-[#080c14] border border-[#223046] p-2 flex items-center justify-center rounded overflow-hidden shadow-2xl relative">
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-h-[58vh] object-contain rounded border border-[#223046]/50"
            />
          </div>

          {/* Map summary chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono-num">
            <span className="text-[#7d90a6]">Included Maps:</span>
            {selectedMatches.map((m, idx) => (
              <span
                key={m.id || idx}
                className="bg-[#111723] border border-[#223046] px-2 py-0.5 rounded text-[11px] text-white flex items-center gap-1.5"
              >
                <span className={m.result === 'W' ? 'text-[#00e5ff]' : 'text-[#ff334b]'}>
                  {m.result === 'W' ? '✓' : '✗'}
                </span>
                <span>{m.mode} - {m.map}</span>
                <span className="text-[#7d90a6]">({m.score_us}:{m.score_them})</span>
              </span>
            ))}
          </div>

        </div>

        {/* Modal Footer with Actions */}
        <div className="p-3.5 border-t border-[#223046] bg-[#111723]/95 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs font-mono-num text-[#7d90a6]">
            Resolution: <span className="text-white font-bold">2400 × 1350 px (16:9 Retina)</span> ready for Discord embeds.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Copy to Clipboard */}
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="flex-1 sm:flex-initial px-4 py-2 bg-[#161e2e] hover:bg-[#223046] border border-[#354b6d] text-white font-display text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer rounded-sm"
            >
              {copied ? <Check size={14} className="text-[#10b981]" /> : <Copy size={14} />}
              <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY IMAGE'}</span>
            </button>

            {/* Download PNG */}
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownload}
              className="flex-1 sm:flex-initial px-5 py-2 bg-[#00e5ff] hover:bg-[#00c8e0] text-[#080c14] font-display font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer rounded-sm shadow-[0_0_15px_rgba(0,229,255,0.3)]"
            >
              <Download size={14} />
              <span>DOWNLOAD PNG</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
