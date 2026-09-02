import React from 'react';
import { LocalProfile } from '../types';
import { Code2, BookOpen, MessageSquare, Swords, GitBranch, LucideIcon } from 'lucide-react';

const TIER_NAMES = ['Novice', 'Practitioner', 'Expert'];

interface SkillDomain {
  icon: LucideIcon;
  label: string;
  value: (profile: LocalProfile) => number;
  thresholds: [number, number, number];
}

const DOMAINS: SkillDomain[] = [
  { icon: Code2, label: 'DSA', value: (p) => p.stats.dsaSolvedCount, thresholds: [1, 10, 30] },
  { icon: BookOpen, label: 'Concepts', value: (p) => p.stats.mlConceptsViewedCount, thresholds: [1, 10, 30] },
  { icon: MessageSquare, label: 'Interview Prep', value: (p) => p.stats.mlQaViewedCount, thresholds: [1, 10, 30] },
  { icon: Swords, label: 'Battles', value: (p) => p.stats.battlesWon, thresholds: [1, 5, 15] },
];

function tierFor(value: number, thresholds: [number, number, number]): number {
  if (value >= thresholds[2]) return 3;
  if (value >= thresholds[1]) return 2;
  if (value >= thresholds[0]) return 1;
  return 0;
}

interface SkillTreeProps {
  profile: LocalProfile;
}

export const SkillTree: React.FC<SkillTreeProps> = ({ profile }) => {
  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-3">
      <div className="flex items-center gap-2 text-success">
        <GitBranch className="w-4 h-4" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">Skill Tree</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DOMAINS.map((domain) => {
          const value = domain.value(profile);
          const tier = tierFor(value, domain.thresholds);
          const Icon = domain.icon;
          const nextThreshold = domain.thresholds[Math.min(tier, 2)];

          return (
            <div
              key={domain.label}
              className={`p-3 rounded-xl border space-y-1.5 ${
                tier > 0 ? 'bg-success/5 border-success/40' : 'bg-surfaceHigh border-border'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${tier > 0 ? 'text-success' : 'text-textMuted'}`} />
                <span className="text-[11px] font-bold text-textPrimary">{domain.label}</span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`w-2 h-2 rounded-full ${
                      dot <= tier ? 'bg-success' : 'bg-border'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-textMuted">
                {tier > 0 ? TIER_NAMES[tier - 1] : 'Locked'}
                {tier < 3 && ` · ${value}/${nextThreshold}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
