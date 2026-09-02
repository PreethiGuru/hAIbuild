import React, { useState, useEffect } from 'react';
import { checkHasGemini } from '../ai/gemini';
import { Flame, Sparkles, WifiOff } from 'lucide-react';

interface HeaderProps {
  streakCount: number;
}

export const Header: React.FC<HeaderProps> = ({ streakCount }) => {
  const [hasGemini, setHasGemini] = useState<boolean>(false);

  useEffect(() => {
    checkHasGemini().then(setHasGemini);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-borderFaint px-4 py-3 max-w-md mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Logo / Mascot icon */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent2 to-accent flex items-center justify-center font-bold text-background shadow">
          🐧
        </div>
        <div>
          <span className="text-sm font-extrabold tracking-tight text-textPrimary block leading-none">
            hAIbuild
          </span>
          <span className="text-[10px] text-textSecondary font-medium">Daily AI/ML Fluency</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
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
