import React from 'react';
import { getMapMetadata } from '../../utils/mapImages';

/**
 * Shared Map Banner Backdrop Component
 * Renders the map photography, procedural gradient fallback,
 * vignette overlays, and left status accent line.
 */
export default function MapBannerBackdrop({
  mapName = '',
  accentColor = '',
  accentClass = ''
}) {
  const mapMeta = getMapMetadata(mapName);

  return (
    <>
      {/* Background Map Image with Fallback Gradient */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={mapMeta.imageUrl}
          alt={mapName}
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {/* Fallback procedural gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r ${mapMeta.theme.gradient} -z-10`} />

        {/* Vignette Overlay for Crisp Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06090e]/85 via-[#06090e]/65 to-[#06090e]/80" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Left Result / Status Accent Bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 ${accentClass}`}
        style={accentColor ? { backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` } : undefined}
      />
    </>
  );
}
