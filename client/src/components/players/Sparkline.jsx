import React from 'react';

export default function Sparkline({ points = [] }) {
  const pts = points.slice(-12);
  if (pts.length < 2) return null;

  const lo = Math.min(...pts);
  const hi = Math.max(...pts);
  const w = 70;
  const h = 22;

  const polyPoints = pts.map((v, i) => {
    const x = ((i * w) / (pts.length - 1)).toFixed(1);
    const y = (hi === lo ? h / 2 : h - 3 - ((v - lo) / (hi - lo)) * (h - 6)).toFixed(1);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="inline-block overflow-visible">
      <polyline
        points={polyPoints}
        fill="none"
        stroke="#00e5ff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
