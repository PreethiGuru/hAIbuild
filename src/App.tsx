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
    recordSpeedRoundResult,
    recordDebugChallengeResult,
    recordMatrixRoundResult,
  } = useDataStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-textPrimary font-sans antialiased flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-border border-t-accent animate-spin" />
          <span className="text-sm text-textSecondary">Loading your progress…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary font-sans antialiased flex flex-col items-center justify-start">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md min-h-screen bg-background border-x border-borderFaint flex flex-col relative shadow-2xl">
        {/* Sticky Header */}
        <Header streakCount={profile.streakCount} />

        {/* What this app is, stated on arrival. Someone opening the link cold
            -- a judge, a first-time visitor -- should not have to infer the
            premise from the tabs. Deliberately not sticky: it has done its job
            once you start scrolling, and pinning it would cost screen height
            on every tab thereafter. */}
        <p className="px-4 py-2 text-[11px] leading-snug text-textSecondary bg-accent/5 border-b border-borderFaint">
          A gamified daily habit that keeps you fluent in AI/ML &mdash; built on real industry
          trend data, so you can skip the doomscrolling.
        </p>

        {/* Tab Content Viewport */}
        <main className="flex-1 px-4 pt-4 pb-20">
          {activeTab === 'today' && (
            <TodayTab
              todayDate={todayDate}
              dailyProgress={dailyProgress}
              onMarkDone={(key) => markContentViewed(todayDate, key)}
              level={profile.level}
            />
          )}

          {activeTab === 'battle' && (
            <BattleTab
              currentRating={profile.rating}
              streakCount={profile.streakCount}
              onRecordResult={(won, diff) => recordBattleResult(won, diff)}
              onRecordSpeedRoundResult={(correct, total) => recordSpeedRoundResult(correct, total)}
              onRecordDebugChallengeResult={(correct) => recordDebugChallengeResult(correct)}
              onRecordMatrixRoundResult={(time, mistakes) => recordMatrixRoundResult(time, mistakes)}
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
