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
    <header className="sticky top-0 z-40 bg-[#0F1419]/90 backdrop-blur-md border-b border-[#1E2D45] px-4 py-3 max-w-md mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Logo / Mascot icon */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1E90FF] to-[#87CEEB] flex items-center justify-center font-bold text-[#0F1419] shadow">
          🐧
        </div>
        <div>
          <span className="text-sm font-extrabold tracking-tight text-[#E8F4F8] block leading-none">
            AIDailyHabit
          </span>
          <span className="text-[10px] text-[#A0B8D4] font-medium">AIML Interview Prep</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Streak Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1A1F2E] border border-[#2A3F5F] text-xs font-bold text-[#F59E0B]">
          <Flame className="w-4 h-4 fill-[#F59E0B]" />
          <span>{streakCount}d</span>
        </div>

        {/* Mode Badge (AI / Offline) */}
        {hasGemini ? (
          <div
            title="Gemini AI Features Active"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#87CEEB]/10 border border-[#87CEEB]/40 text-[#87CEEB] text-[10px] font-bold"
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Mode</span>
          </div>
        ) : (
          <div
            title="Local Offline Mode Active"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#212838] border border-[#2A3F5F] text-[#5A7AA0] text-[10px] font-bold"
          >
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        )}
      </div>
    </header>
  );
};
