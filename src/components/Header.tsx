import React, { useState, useEffect } from 'react';
import { checkHasGemini } from '../ai/gemini';
import { Flame, Sparkles, WifiOff } from 'lucide-react';
import { FontSizeControl } from './FontSizeControl';

interface HeaderProps {
  streakCount: number;
}

export const Header: React.FC<HeaderProps> = ({ streakCount }) => {
  const [hasGemini, setHasGemini] = useState<boolean>(false);

  useEffect(() => {
    checkHasGemini().then(setHasGemini);
  }, []);

  return (
    // No mx-auto here: as a flex item in the column frame, auto inline margins
    // cancel the default stretch and shrink the header to its content width,
    // leaving it floating narrower than the page like a banner. The frame is
    // already max-w-md, so the width cap was redundant as well.
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-borderFaint px-4 py-3 w-full flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {/* Logo / Mascot icon */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent2 to-accent flex items-center justify-center font-bold text-background shadow shrink-0">
          🐧
        </div>
        <div className="min-w-0">
          <span className="text-sm font-extrabold tracking-tight text-textPrimary block leading-none">
            hAIbuild
          </span>
          <span className="text-[10px] text-textSecondary font-medium block truncate">
            Daily AI/ML Fluency
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <FontSizeControl />

        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-xs font-bold text-warning">
          <Flame className="w-4 h-4 fill-warning" />
          <span>{streakCount}d</span>
        </div>

        {/* Mode Badge (AI / Offline) */}
        {hasGemini ? (
          <div
            title="Gemini AI Features Active"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent/10 border border-accent/40 text-accent text-[10px] font-bold"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Mode</span>
          </div>
        ) : (
          <div
            title="Local Offline Mode Active"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-surfaceHigh border border-border text-textMuted text-[10px] font-bold"
          >
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        )}
      </div>
    </header>
  );
};
