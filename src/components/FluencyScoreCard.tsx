import React, { useState } from 'react';
import { LocalProfile } from '../types';
import { CoachReport, fetchCoachReport } from '../ai/gemini';
import { getOrCreateUid } from '../store/localStore';
import { Bot, Share2, Check, Sparkles, Target } from 'lucide-react';
import { FormattedText } from './FormattedText';

interface FluencyScoreCardProps {
  profile: LocalProfile;
}

const BREAKDOWN_LABELS: Array<{ key: keyof CoachReport['fluency']['breakdown']; label: string; max: number }> = [
  { key: 'consistency', label: 'Consistency', max: 30 },
  { key: 'depth', label: 'Depth', max: 25 },
  { key: 'breadth', label: 'Breadth', max: 20 },
  { key: 'competitive', label: 'Competitive', max: 15 },
  { key: 'accuracy', label: 'Accuracy', max: 10 },
];

export const FluencyScoreCard: React.FC<FluencyScoreCardProps> = ({ profile }) => {
  const [report, setReport] = useState<CoachReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState<boolean>(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    const res = await fetchCoachReport(getOrCreateUid(), {
      streakCount: profile.streakCount,
      longestStreak: profile.longestStreak,
      level: profile.level,
      xp: profile.xp,
      rating: profile.rating,
      dsaSolvedCount: profile.stats.dsaSolvedCount,
      mlConceptsViewedCount: profile.stats.mlConceptsViewedCount,
      mlQaViewedCount: profile.stats.mlQaViewedCount,
      battlesPlayed: profile.stats.battlesPlayed,
      battlesWon: profile.stats.battlesWon,
      speedRoundsPlayed: profile.stats.speedRoundsPlayed,
      debugChallengesSolved: profile.stats.debugChallengesSolved,
      matrixRoundsCompleted: profile.stats.matrixRoundsCompleted,
    });
    setLoading(false);
    if (!res) {
      setError("Couldn't generate your report right now. Try again shortly.");
      return;
    }
    setReport(res);
  };

  const handleShare = async () => {
    if (!report) return;
    const text =
      `My hAIbuild AI/ML Fluency Score: ${report.fluency.score}/100 (${report.fluency.tier})\n` +
      `${profile.streakCount}-day streak · Level ${profile.level} · ELO ${profile.rating}\n` +
      (report.focusAreas.length
        ? `This week I'm focusing on: ${report.focusAreas.map((f) => f.title).join(', ')}\n`
        : '') +
      `\nBuilding my AI/ML habit with hAIbuild.`;

    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch (e) {
      // A user dismissing the native share sheet lands here too -- not an error worth surfacing.
      console.error('Share cancelled or failed:', e);
    }
  };

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-4">
      <div className="flex items-center gap-2 text-accent">
        <Bot className="w-4 h-4" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">
          Weekly Fluency Report
        </h3>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {!report ? (
        <>
          <p className="text-xs text-textSecondary leading-relaxed">
            Your Coach Agent scores your AI/ML fluency out of 100 from your real activity, then
            tells you what to focus on next.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm bg-accent text-background hover:bg-accent2 hover:text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Coach is reviewing your week...' : 'Get my weekly report'}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-end gap-3">
            <div className="text-5xl font-bold text-accent leading-none">{report.fluency.score}</div>
            <div className="pb-1">
              <div className="text-sm font-bold text-textPrimary">{report.fluency.tier}</div>
              <div className="text-[10px] text-textMuted">out of 100</div>
            </div>
          </div>

          <div className="space-y-1.5">
            {BREAKDOWN_LABELS.map(({ key, label, max }) => {
              const value = report.fluency.breakdown[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-[10px] text-textMuted w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-accent transition-all duration-700"
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-textSecondary w-10 text-right tabular-nums">
                    {value}/{max}
                  </span>
                </div>
              );
            })}
          </div>

          <FormattedText className="text-xs text-textSecondary leading-relaxed">
            {report.assessment}
          </FormattedText>

          {report.focusAreas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-textMuted">
                <Target className="w-3 h-3" />
                <span>Focus this week</span>
              </div>
              {report.focusAreas.map((area) => (
                <div key={area.title} className="p-2.5 rounded-xl bg-surfaceHigh border border-border">
                  <div className="text-xs font-bold text-textPrimary">{area.title}</div>
                  <FormattedText className="text-[11px] text-textMuted leading-relaxed">{area.why}</FormattedText>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleShare}
            className="w-full py-2.5 rounded-xl font-bold text-sm border-2 border-accent2 text-accent2 hover:bg-accent2/10 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {shared ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share my score</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
};
