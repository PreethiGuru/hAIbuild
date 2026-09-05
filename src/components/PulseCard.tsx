import React, { useEffect, useState } from 'react';
import { DailyPulse, fetchTodayPulse } from '../ai/gemini';
import { Activity } from 'lucide-react';
import { FormattedText } from './FormattedText';

export const PulseCard: React.FC = () => {
  const [pulse, setPulse] = useState<DailyPulse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchTodayPulse()
      .then(setPulse)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg space-y-3">
      <div className="flex items-center gap-2">
        <div className="p-2 rounded-lg bg-accent/10 text-accent">
          <Activity className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
          Pulse · What's Trending
        </span>
      </div>

      {loading ? (
        <p className="text-xs text-textMuted">Reading today's signal...</p>
      ) : pulse ? (
        <>
          <h2 className="text-lg font-bold text-textPrimary">{pulse.headline}</h2>
          <FormattedText className="text-sm text-textSecondary leading-relaxed">
            {pulse.briefing}
          </FormattedText>
          {pulse.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {pulse.topics.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 text-[11px] font-medium bg-accent/10 text-accent rounded-md border border-accent/30"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="text-xs text-textMuted">
          Today's Pulse briefing isn't ready yet -- check back soon.
        </p>
      )}
    </div>
  );
};
