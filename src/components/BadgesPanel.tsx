import React, { useEffect, useState } from 'react';
import { LocalProfile } from '../types';
import { checkMonthlyChampionEligibility, claimBadgeReward, MONTHLY_BADGE_THRESHOLD } from '../store/firestoreStore';
import { Award, Flame, Swords, Code2, BookOpen, Target, Mountain, Calendar, LucideIcon, Snowflake, Check } from 'lucide-react';

interface StaticBadge {
  id: string;
  icon: LucideIcon;
  label: string;
  reward: number;
  isUnlocked: (profile: LocalProfile, totalQuestions: number) => boolean;
}

const STATIC_BADGES: StaticBadge[] = [
  { id: 'first-steps', icon: Award, label: 'First Steps', reward: 5, isUnlocked: (_p, total) => total >= 1 },
  { id: 'week-warrior', icon: Flame, label: 'Week Warrior', reward: 10, isUnlocked: (p) => p.longestStreak >= 7 },
  { id: 'dsa-grinder', icon: Code2, label: 'DSA Grinder', reward: 15, isUnlocked: (p) => p.stats.dsaSolvedCount >= 20 },
  { id: 'concept-collector', icon: BookOpen, label: 'Concept Collector', reward: 15, isUnlocked: (p) => p.stats.mlConceptsViewedCount >= 20 },
  { id: 'battle-tested', icon: Swords, label: 'Battle-Tested', reward: 15, isUnlocked: (p) => p.stats.battlesPlayed >= 10 },
  { id: 'sharp-shooter', icon: Target, label: 'Sharp Shooter', reward: 15, isUnlocked: (p) => p.stats.battlesWon >= 10 },
  { id: 'century-club', icon: Mountain, label: 'Century Club', reward: 25, isUnlocked: (_p, total) => total >= 100 },
];

const MONTHLY_BADGE_ID = 'monthly-champion';
const MONTHLY_BADGE_REWARD = 40;

interface RenderBadge {
  id: string;
  icon: LucideIcon;
  label: string;
  reward: number;
  unlocked: boolean;
}

interface BadgesPanelProps {
  profile: LocalProfile;
  totalQuestions: number;
  onProfileChange: () => void;
}

export const BadgesPanel: React.FC<BadgesPanelProps> = ({ profile, totalQuestions, onProfileChange }) => {
  const [monthlyUnlocked, setMonthlyUnlocked] = useState<boolean>(false);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    checkMonthlyChampionEligibility().then(setMonthlyUnlocked);
  }, [profile.stats]);

  const badges: RenderBadge[] = [
    ...STATIC_BADGES.map((b) => ({
      id: b.id,
      icon: b.icon,
      label: b.label,
      reward: b.reward,
      unlocked: b.isUnlocked(profile, totalQuestions),
    })),
    {
      id: MONTHLY_BADGE_ID,
      icon: Calendar,
      label: 'Monthly Champion',
      reward: MONTHLY_BADGE_REWARD,
      unlocked: monthlyUnlocked,
    },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const handleClaim = async (badge: RenderBadge) => {
    setClaimingId(badge.id);
    const res = await claimBadgeReward(badge.id, badge.reward);
    setClaimingId(null);
    if (res.success) onProfileChange();
  };

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent2">
          <Award className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">Badges</h3>
        </div>
        <span className="text-[10px] font-semibold text-textMuted">
          {unlockedCount} / {badges.length}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {badges.map((badge) => {
          const Icon = badge.icon;
          const claimed = profile.claimedBadgeIds.includes(badge.id);
          const claimable = badge.unlocked && !claimed;

          return (
            <div key={badge.id} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border relative ${
                  badge.unlocked
                    ? 'bg-accent2/10 border-accent2 text-accent2'
                    : 'bg-surfaceHigh border-border text-textMuted opacity-50'
                }`}
                title={badge.id === MONTHLY_BADGE_ID ? `${MONTHLY_BADGE_THRESHOLD}+ full days in the last 30` : undefined}
              >
                <Icon className="w-5 h-5" />
                {claimed && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success flex items-center justify-center border border-surface">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              <span
                className={`text-[9px] font-semibold leading-tight ${
                  badge.unlocked ? 'text-textPrimary' : 'text-textMuted'
                }`}
              >
                {badge.label}
              </span>
              {claimable && (
                <button
                  onClick={() => handleClaim(badge)}
                  disabled={claimingId === badge.id}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent2 text-white text-[9px] font-bold hover:bg-accent2/80 transition cursor-pointer disabled:opacity-50"
                >
                  <Snowflake className="w-2.5 h-2.5" />+{badge.reward}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
