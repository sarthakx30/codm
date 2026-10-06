import React from 'react';
import { THEME_CLASSES } from '../../config/theme';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className={`fixed left-1/2 bottom-20 -translate-x-1/2 ${THEME_CLASSES.btnPrimary} px-5 py-2 text-base z-50 clip-badge animate-bounce`}>
      {message}
    </div>
  );
}
