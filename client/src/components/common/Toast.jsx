import React from 'react';
import { THEME_CLASSES } from '../../config/theme';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className={`fixed left-1/2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6 -translate-x-1/2 ${THEME_CLASSES.btnPrimary} px-5 py-2 text-base z-50 clip-badge animate-bounce max-w-[calc(100vw-2rem)] text-center`}>
      {message}
    </div>
  );
}
