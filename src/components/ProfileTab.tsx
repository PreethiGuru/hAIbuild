import React, { useState, useEffect } from 'react';
import { LocalProfile } from '../types';
import { PenguinMascot } from './PenguinMascot/PenguinMascot';
import { checkHasGemini, fetchAIDailySummary } from '../ai/gemini';
import { Flame, Shield, Award, Zap, Code2, BookOpen, MessageSquare, Swords, Bot, Sparkles, TrendingUp } from 'lucide-react';

interface ProfileTabProps {
  profile: LocalProfile;
  onRefresh: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile, onRefresh }) => {
  const [hasGemini, setHasGemini] = useState<boolean>(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [showSummaryCard, setShowSummaryCard] = useState<boolean>(false);

  useEffect(() => {
    checkHasGemini().then(setHasGemini);
    onRefresh();
  }, [onRefresh]);

  // Calculate total questions solved/viewed for mountain climb progress (target 1,000)
  const totalQuestions =
    profile.stats.dsaSolvedCount +
    profile.stats.mlConceptsViewedCount +
    profile.stats.mlQaViewedCount +
    profile.stats.battlesWon;

  const mountainProgress = Math.min(100, (totalQuestions / 1000) * 100);

  // Win rate calculation
  const winRate =
    profile.stats.battlesPlayed > 0
      ? Math.round((profile.stats.battlesWon / profile.stats.battlesPlayed) * 100)
      : 0;

  const handleFetchAiSummary = async () => {
    if (aiSummary) {
      setShowSummaryCard(!showSummaryCard);
      return;
    }

    setLoadingSummary(true);
    const summary = await fetchAIDailySummary({
      rating: profile.rating,
      streakCount: profile.streakCount,
      dsaSolvedCount: profile.stats.dsaSolvedCount,
      mlConceptsViewedCount: profile.stats.mlConceptsViewedCount,
      battlesPlayed: profile.stats.battlesPlayed,
      battlesWon: profile.stats.battlesWon,
    });
    setLoadingSummary(false);

    if (summary) {
      setAiSummary(summary);
      setShowSummaryCard(true);
    }
  };

  return (
    <div className="space-y-6 pb-24 text-[#E8F4F8]">
      {/* Profile Header Card */}
      <div className="bg-[#1A1F2E] p-5 rounded-2xl border border-[#2A3F5F] shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#87CEEB]/20 text-[#87CEEB] text-xs font-bold uppercase tracking-wider">
              Level {profile.level}
            </span>
            <span className="text-xs text-[#A0B8D4]">{profile.xp} XP</span>
          </div>
          <h1 className="text-xl font-bold text-[#E8F4F8]">AIML Explorer</h1>
          <p className="text-xs text-[#5A7AA0]">Consistent Daily Learner</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-[#212838] border border-[#2A3F5F] flex items-center justify-center shadow-inner">
          <PenguinMascot state="idle" size="small" />
        </div>
      </div>

      {/* Mountain Climb Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#87CEEB]">
            Mountain Climb Progress
          </span>
          <span className="text-xs font-semibold text-[#A0B8D4]">
            <strong className="text-[#87CEEB]">{totalQuestions}</strong> / 1,000 milestones
          </span>
        </div>

        <PenguinMascot
          showMountain={true}
          progress={mountainProgress}
          className="shadow-xl"
        />
      </div>

      {/* Progress Bar with Milestone Markers */}
      <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-[#2A3F5F] space-y-2 shadow-md">
        <div className="flex justify-between text-[11px] text-[#A0B8D4] font-semibold">
          <span>Base (0)</span>
          <span>100Q</span>
          <span>500Q</span>
          <span>1,000Q Summit</span>
        </div>
        <div className="w-full h-3 bg-[#0F1419] rounded-full overflow-hidden border border-[#2A3F5F] relative">
          <div
            className="h-full bg-gradient-to-r from-[#1E90FF] via-[#87CEEB] to-[#26D07C] transition-all duration-700"
            style={{ width: `${mountainProgress}%` }}
          />
        </div>
      </div>

      {/* 2x2 Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-[#2A3F5F] shadow space-y-1">
          <div className="flex items-center gap-2 text-[#F59E0B]">
            <Flame className="w-5 h-5 fill-[#F59E0B]" />
            <span className="text-xs font-bold uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-2xl font-bold text-[#E8F4F8]">{profile.streakCount} days</div>
          <div className="text-[10px] text-[#5A7AA0]">Best: {profile.longestStreak} days</div>
        </div>

        {/* Elo Rating */}
        <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-[#2A3F5F] shadow space-y-1">
          <div className="flex items-center gap-2 text-[#87CEEB]">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Elo Rating</span>
          </div>
          <div className="text-2xl font-bold text-[#E8F4F8]">{profile.rating}</div>
          <div className="text-[10px] text-[#5A7AA0]">Ranked Competitive</div>
        </div>

        {/* Win Rate */}
        <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-[#2A3F5F] shadow space-y-1">
          <div className="flex items-center gap-2 text-[#26D07C]">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-[#E8F4F8]">{winRate}%</div>
          <div className="text-[10px] text-[#5A7AA0]">{profile.stats.battlesWon} / {profile.stats.battlesPlayed} battles</div>
        </div>

        {/* Level & XP */}
        <div className="bg-[#1A1F2E] p-4 rounded-2xl border border-[#2A3F5F] shadow space-y-1">
          <div className="flex items-center gap-2 text-[#1E90FF]">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Level & XP</span>
          </div>
          <div className="text-2xl font-bold text-[#E8F4F8]">Lvl {profile.level}</div>
          <div className="text-[10px] text-[#5A7AA0]">{profile.xp} Total XP</div>
        </div>
      </div>

      {/* AI Performance Feedback Button */}
      {hasGemini && (
        <div className="space-y-3">
          <button
            onClick={handleFetchAiSummary}
            disabled={loadingSummary}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#1A1F2E] to-[#212838] border-2 border-[#87CEEB] text-[#87CEEB] hover:bg-[#87CEEB]/10 transition font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            <Bot className="w-5 h-5" />
            {loadingSummary ? 'Analyzing Your Performance...' : showSummaryCard ? 'Hide AI Feedback' : 'How am I doing?'}
          </button>

          {showSummaryCard && aiSummary && (
            <div className="p-4 bg-[#1A1F2E] rounded-2xl border border-[#87CEEB]/50 shadow-xl flex gap-4 items-start animate-fade-in">
              <div className="shrink-0 pt-1">
                <PenguinMascot state="walking" size="small" />
              </div>
              <div className="space-y-1 text-xs text-[#E8F4F8]">
                <div className="flex items-center gap-1.5 font-bold text-[#87CEEB]">
                  <Sparkles className="w-4 h-4" />
                  <span>Coach Penguin AI Feedback</span>
                </div>
                <p className="leading-relaxed text-[#A0B8D4]">{aiSummary}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Learning Stats */}
      <div className="bg-[#1A1F2E] p-5 rounded-2xl border border-[#2A3F5F] shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#5A7AA0] mb-2">
          LEARNING BREAKDOWN
        </h3>

        <div className="divide-y divide-[#1E2D45] text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#A0B8D4]">
              <Code2 className="w-4 h-4 text-[#87CEEB]" />
              <span>DSA Problems Solved</span>
            </div>
            <span className="font-bold text-[#E8F4F8]">{profile.stats.dsaSolvedCount}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#A0B8D4]">
              <BookOpen className="w-4 h-4 text-[#1E90FF]" />
              <span>ML Concepts Studied</span>
            </div>
            <span className="font-bold text-[#E8F4F8]">{profile.stats.mlConceptsViewedCount}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#A0B8D4]">
              <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
              <span>ML Interview Q&As</span>
            </div>
            <span className="font-bold text-[#E8F4F8]">{profile.stats.mlQaViewedCount}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#A0B8D4]">
              <Swords className="w-4 h-4 text-[#FF6B6B]" />
              <span>Practice Battles Played</span>
            </div>
            <span className="font-bold text-[#E8F4F8]">{profile.stats.battlesPlayed}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#A0B8D4]">
              <Award className="w-4 h-4 text-[#26D07C]" />
              <span>Battles Won / Lost</span>
            </div>
            <span className="font-bold text-[#E8F4F8]">
              {profile.stats.battlesWon} W / {profile.stats.battlesLost} L
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
