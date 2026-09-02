import React from 'react';
import { LocalProfile } from '../types';
import { Award, Flame, Swords, Code2, BookOpen, Target, Mountain, LucideIcon } from 'lucide-react';

interface Badge {
  icon: LucideIcon;
  label: string;
  isUnlocked: (profile: LocalProfile, totalQuestions: number) => boolean;
}

const BADGES: Badge[] = [
  { icon: Award, label: 'First Steps', isUnlocked: (_p, total) => total >= 1 },
  { icon: Flame, label: 'Week Warrior', isUnlocked: (p) => p.longestStreak >= 7 },
  { icon: Code2, label: 'DSA Grinder', isUnlocked: (p) => p.stats.dsaSolvedCount >= 20 },
  { icon: BookOpen, label: 'Concept Collector', isUnlocked: (p) => p.stats.mlConceptsViewedCount >= 20 },
  { icon: Swords, label: 'Battle-Tested', isUnlocked: (p) => p.stats.battlesPlayed >= 10 },
  { icon: Target, label: 'Sharp Shooter', isUnlocked: (p) => p.stats.battlesWon >= 10 },
  { icon: Mountain, label: 'Century Club', isUnlocked: (_p, total) => total >= 100 },
];

interface BadgesPanelProps {
  profile: LocalProfile;
  totalQuestions: number;
}

export const BadgesPanel: React.FC<BadgesPanelProps> = ({ profile, totalQuestions }) => {
  const unlockedCount = BADGES.filter((b) => b.isUnlocked(profile, totalQuestions)).length;

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent2">
          <Award className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">Badges</h3>
        </div>
        <span className="text-[10px] font-semibold text-textMuted">
          {unlockedCount} / {BADGES.length}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {BADGES.map((badge) => {
          const unlocked = badge.isUnlocked(profile, totalQuestions);
          const Icon = badge.icon;
          return (
            <div key={badge.label} className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                  unlocked
                    ? 'bg-accent2/10 border-accent2 text-accent2'
                    : 'bg-surfaceHigh border-border text-textMuted opacity-50'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[9px] font-semibold leading-tight ${
                  unlocked ? 'text-textPrimary' : 'text-textMuted'
                }`}
              >
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
