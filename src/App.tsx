import React, { useState } from 'react';
import { useDataStore } from './store/useDataStore';
import { TabBar, TabType } from './components/TabBar';
import { Header } from './components/Header';
import { TodayTab } from './components/TodayTab';
import { BattleTab } from './components/BattleTab';
import { ProfileTab } from './components/ProfileTab';
import { PitchTab } from './components/PitchTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const {
    profile,
    todayDate,
    dailyProgress,
    loading,
    refreshProfile,
    markContentViewed,
    recordBattleResult,
  } = useDataStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-[#E8F4F8] font-sans antialiased flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#2A3F5F] border-t-[#87CEEB] animate-spin" />
          <span className="text-sm text-[#A0B8D4]">Loading your progress…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E8F4F8] font-sans antialiased flex flex-col items-center justify-start">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md min-h-screen bg-[#0F1419] border-x border-[#1E2D45] flex flex-col relative shadow-2xl">
        {/* Sticky Header */}
        <Header streakCount={profile.streakCount} />

        {/* Tab Content Viewport */}
        <main className="flex-1 px-4 pt-4 pb-20">
          {activeTab === 'today' && (
            <TodayTab
              todayDate={todayDate}
              dailyProgress={dailyProgress}
              onMarkDone={(key) => markContentViewed(todayDate, key)}
            />
          )}

          {activeTab === 'battle' && (
            <BattleTab
              currentRating={profile.rating}
              onRecordResult={(won, diff) => recordBattleResult(won, diff)}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab
              profile={profile}
              onRefresh={refreshProfile}
            />
          )}

          {activeTab === 'pitch' && (
            <PitchTab
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}
        </main>

        {/* Fixed Bottom Navigation Bar */}
        <TabBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          streakCount={profile.streakCount}
        />
      </div>
    </div>
  );
}
