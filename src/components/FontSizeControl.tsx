import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  FONT_SCALE_LEVELS,
  applyFontScale,
  loadFontScaleIndex,
  saveFontScaleIndex,
} from '../store/fontScale';

/**
 * Two explicit steps rather than one cycling button: at three levels a cycle
 * gives no clue which way it will jump or that it wraps, whereas a pair that
 * disables at the ends shows the whole range at a glance.
 */
export const FontSizeControl: React.FC = () => {
  const [index, setIndex] = useState<number>(() => loadFontScaleIndex());

  const change = (delta: number) => {
    const next = Math.max(0, Math.min(FONT_SCALE_LEVELS.length - 1, index + delta));
    if (next === index) return;
    setIndex(next);
    applyFontScale(next);
    saveFontScaleIndex(next);
  };

  const atMin = index === 0;
  const atMax = index === FONT_SCALE_LEVELS.length - 1;
  const buttonClass =
    'w-6 h-6 flex items-center justify-center rounded-md text-textSecondary ' +
    'hover:bg-surfaceHigh hover:text-textPrimary transition disabled:opacity-30 ' +
    'disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer';

  return (
    <div
      className="flex items-center rounded-full bg-surface border border-border px-0.5"
      role="group"
      aria-label="Text size"
    >
      <button
        type="button"
        onClick={() => change(-1)}
        disabled={atMin}
        className={buttonClass}
        title="Smaller text"
        aria-label="Decrease text size"
      >
        <Minus className="w-3 h-3" />
      </button>

      <span
        className="px-0.5 font-bold text-textSecondary select-none leading-none"
        // Sized in px, not rem: this label is the control for the root font
        // size, so a rem size would make it grow as you press it.
        style={{ fontSize: '11px' }}
        title={`Text size: ${FONT_SCALE_LEVELS[index].label}`}
        aria-live="polite"
      >
        A
      </span>

      <button
        type="button"
        onClick={() => change(1)}
        disabled={atMax}
        className={buttonClass}
        title="Larger text"
        aria-label="Increase text size"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};
