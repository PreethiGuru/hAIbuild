import React, { useState, useEffect } from 'react';
import { LeaderboardEntry, LocalProfile } from '../types';
import { PenguinMascot, EVOLUTION_TIER_NAMES, getEvolutionTier } from './PenguinMascot/PenguinMascot';
import { checkHasGemini } from '../ai/gemini';
import { loadLeaderboard, WEEKS_FOR_YEAR_ACHIEVEMENT } from '../store/firestoreStore';
import { getOrCreateUid } from '../store/localStore';
import { SkillTree } from './SkillTree';
import { BadgesPanel } from './BadgesPanel';
import { GuildCard } from './GuildCard';
import { ShopCard } from './ShopCard';
import { FluencyScoreCard } from './FluencyScoreCard';
import { Flame, Shield, Award, Zap, Code2, BookOpen, MessageSquare, Swords, TrendingUp, Snowflake, Trophy, Bug, Grid3x3, Star } from 'lucide-react';

interface ProfileTabProps {
  profile: LocalProfile;
  onRefresh: () => void;
}

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile, onRefresh }) => {
  const [hasGemini, setHasGemini] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState<boolean>(true);

  useEffect(() => {
    checkHasGemini().then(setHasGemini);
    onRefresh();
    loadLeaderboard()
      .then(setLeaderboard)
      .finally(() => setLeaderboardLoading(false));
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


  return (
    <div className="space-y-6 pb-24 text-textPrimary">
      {/* Profile Header Card */}
      <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
              Level {profile.level}
            </span>
            <span className="text-xs text-textSecondary">{profile.xp} XP</span>
          </div>
          <h1 className="text-xl font-bold text-textPrimary">{EVOLUTION_TIER_NAMES[getEvolutionTier(profile.level)]} Penguin</h1>
          <p className="text-xs text-textMuted">Consistent Daily Learner</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-surfaceHigh border border-border flex items-center justify-center shadow-inner">
          <PenguinMascot state="idle" size="small" level={profile.level} />
        </div>
      </div>

      {/* Mountain Climb Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">
            Mountain Climb Progress
          </span>
          <span className="text-xs font-semibold text-textSecondary">
            <strong className="text-accent">{totalQuestions}</strong> / 1,000 milestones
          </span>
        </div>

        <PenguinMascot
          showMountain={true}
          progress={mountainProgress}
          level={profile.level}
          className="shadow-xl"
        />
      </div>

      {/* Progress Bar with Milestone Markers */}
      <div className="bg-surface p-4 rounded-2xl border border-border space-y-2 shadow-md">
        <div className="flex justify-between text-[11px] text-textSecondary font-semibold">
          <span>Base (0)</span>
          <span>100Q</span>
          <span>500Q</span>
          <span>1,000Q Summit</span>
        </div>
        <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-border relative">
          <div
            className="h-full bg-gradient-to-r from-accent2 via-accent to-success transition-all duration-700"
            style={{ width: `${mountainProgress}%` }}
          />
        </div>
      </div>

      {/* 2x2 Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow space-y-1">
          <div className="flex items-center gap-2 text-warning">
            <Flame className="w-5 h-5 fill-warning" />
            <span className="text-xs font-bold uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-2xl font-bold text-textPrimary">{profile.streakCount} days</div>
          <div className="text-[10px] text-textMuted">Best: {profile.longestStreak} days</div>
          <div
            className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
              profile.streakFreezeCount > 0 ? 'text-accent2' : 'text-textMuted'
            }`}
          >
            <Snowflake className="w-3 h-3" />
            {profile.streakFreezeCount > 0
              ? `${profile.streakFreezeCount} freeze${profile.streakFreezeCount > 1 ? 's' : ''} ready`
              : `Next freeze in ${daysUntil(profile.nextFreezeGrantAt)}d`}
          </div>
        </div>

        {/* Elo Rating */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow space-y-1">
          <div className="flex items-center gap-2 text-accent">
            <Shield className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Elo Rating</span>
          </div>
          <div className="text-2xl font-bold text-textPrimary">{profile.rating}</div>
          <div className="text-[10px] text-textMuted">Ranked Competitive</div>
        </div>

        {/* Win Rate */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow space-y-1">
          <div className="flex items-center gap-2 text-success">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Win Rate</span>
          </div>
          <div className="text-2xl font-bold text-textPrimary">{winRate}%</div>
          <div className="text-[10px] text-textMuted">{profile.stats.battlesWon} / {profile.stats.battlesPlayed} battles</div>
        </div>

        {/* Level & XP */}
        <div className="bg-surface p-4 rounded-2xl border border-border shadow space-y-1">
          <div className="flex items-center gap-2 text-accent2">
            <Zap className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Level & XP</span>
          </div>
          <div className="text-2xl font-bold text-textPrimary">Lvl {profile.level}</div>
          <div className="text-[10px] text-textMuted">{profile.xp} Total XP</div>
        </div>
      </div>

      {/* Weekly Coach report + shareable fluency score */}
      {hasGemini && <FluencyScoreCard profile={profile} />}

      {/* Shop */}
      <ShopCard profile={profile} onProfileChange={onRefresh} />

      {/* Year Achievement Progress */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-warning">
            <Star className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider text-textMuted">
              Year Achievement
            </span>
          </div>
          <span className="text-[10px] font-semibold text-textMuted">
            {profile.weeklyQualifyingStreak} / {WEEKS_FOR_YEAR_ACHIEVEMENT} weeks
          </span>
        </div>
        <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-gradient-to-r from-warning to-accent transition-all duration-700"
            style={{ width: `${Math.min(100, (profile.weeklyQualifyingStreak / WEEKS_FOR_YEAR_ACHIEVEMENT) * 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-textMuted">
          Complete all 3 daily items on 5+ days, every week, for a full year to earn it.
          {profile.yearAchievementCount > 0 && ` Earned ${profile.yearAchievementCount}x so far!`}
        </p>
      </div>

      {/* Guild */}
      <GuildCard profile={profile} onProfileChange={onRefresh} />

      {/* Skill Tree */}
      <SkillTree profile={profile} />

      {/* Badges */}
      <BadgesPanel profile={profile} totalQuestions={totalQuestions} onProfileChange={onRefresh} />

      {/* Leaderboard */}
      <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-warning">
          <Trophy className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">
            Leaderboard
          </h3>
        </div>

        {leaderboardLoading ? (
          <p className="text-xs text-textMuted py-2">Loading rankings...</p>
        ) : leaderboard.length === 0 ? (
          <p className="text-xs text-textMuted py-2">No ranked learners yet.</p>
        ) : (
          <div className="divide-y divide-borderFaint text-xs">
            {leaderboard.map((entry, idx) => {
              const isYou = entry.uid === getOrCreateUid();
              return (
                <div key={entry.uid} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-5 text-center font-bold ${
                        idx === 0 ? 'text-warning' : 'text-textMuted'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className={isYou ? 'font-bold text-accent' : 'text-textSecondary'}>
                      {isYou ? 'You' : `Learner ${entry.uid.slice(-4)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-textMuted">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {entry.streakCount}
                    </span>
                    <span className="font-bold text-textPrimary">{entry.rating}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Learning Stats */}
      <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted mb-2">
          LEARNING BREAKDOWN
        </h3>

        <div className="divide-y divide-borderFaint text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textSecondary">
              <Code2 className="w-4 h-4 text-accent" />
              <span>DSA Problems Solved</span>
            </div>
            <span className="font-bold text-textPrimary">{profile.stats.dsaSolvedCount}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textSecondary">
              <BookOpen className="w-4 h-4 text-accent2" />
              <span>ML Concepts Studied</span>
            </div>
            <span className="font-bold text-textPrimary">{profile.stats.mlConceptsViewedCount}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textSecondary">
              <MessageSquare className="w-4 h-4 text-warning" />
              <span>ML Interview Q&As</span>
            </div>
            <span className="font-bold text-textPrimary">{profile.stats.mlQaViewedCount}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textSecondary">
              <Swords className="w-4 h-4 text-danger" />
              <span>Practice Battles Played</span>
            </div>
            <span className="font-bold text-textPrimary">{profile.stats.battlesPlayed}</span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textSecondary">
              <Award className="w-4 h-4 text-success" />
              <span>Battles Won / Lost</span>
            </div>
            <span className="font-bold text-textPrimary">
              {profile.stats.battlesWon} W / {profile.stats.battlesLost} L
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textSecondary">
              <Zap className="w-4 h-4 text-accent2" />
              <span>Speed Round Best Score</span>
            </div>
            <span className="font-bold text-textPrimary">
              {profile.stats.speedRoundBestScore} ({profile.stats.speedRoundsPlayed} played)
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textSecondary">
              <Bug className="w-4 h-4 text-danger" />
              <span>Debug Challenges Solved</span>
            </div>
            <span className="font-bold text-textPrimary">
              {profile.stats.debugChallengesSolved} / {profile.stats.debugChallengesAttempted}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-textSecondary">
              <Grid3x3 className="w-4 h-4 text-accent2" />
              <span>Matrix Mode Best Time</span>
            </div>
            <span className="font-bold text-textPrimary">
              {profile.stats.matrixBestTimeMs > 0
                ? `${(profile.stats.matrixBestTimeMs / 1000).toFixed(1)}s`
                : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
