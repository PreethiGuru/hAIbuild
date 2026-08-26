import React from 'react';
import { CalendarDays, Swords, User, Sparkles } from 'lucide-react';

export type TabType = 'today' | 'battle' | 'profile' | 'pitch';

interface TabBarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  streakCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelectTab, streakCount }) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'today', label: 'Today', icon: CalendarDays },
    { id: 'battle', label: 'Battle', icon: Swords },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'pitch', label: 'Pitch Doc', icon: Sparkles },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1F2E]/95 backdrop-blur-md border-t border-[#2A3F5F] px-4 py-2 max-w-md mx-auto">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition cursor-pointer relative ${
                isActive
                  ? 'text-[#87CEEB] font-bold'
                  : 'text-[#5A7AA0] hover:text-[#A0B8D4] font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.id === 'profile' && streakCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#F59E0B] text-[#0F1419] text-[9px] font-extrabold px-1 rounded-full">
                    {streakCount}
                  </span>
                )}
              </div>
              <span className="text-[11px] tracking-wide">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#87CEEB] absolute -bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
