import React, { useCallback, useEffect, useState } from 'react';
import { LeagueStanding, LocalProfile } from '../types';
import {
  divisionName,
  getDivisionBands,
  msUntilNextLeagueReset,
  snowflakesForPromotion,
  tierColorOf,
  tierNameOf,
  MAX_DIVISION,
} from '../constants/leagues';
import { acknowledgeLeagueResult, loadLeagueStandings } from '../store/firestoreStore';
import { getOrCreateUid } from '../store/localStore';
import { ChevronDown, ChevronUp, Flame, Minus, Shield, Trophy } from 'lucide-react';

interface LeagueCardProps {
  profile: LocalProfile;
  onProfileChange: () => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'any moment now';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const VISIBLE_ROWS = 10;

export const LeagueCard: React.FC<LeagueCardProps> = ({ profile, onProfileChange }) => {
  const [standings, setStandings] = useState<LeagueStanding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [msLeft, setMsLeft] = useState<number>(() => msUntilNextLeagueReset());

  const { divisionIndex, lastLeagueResult } = profile;
  const uid = getOrCreateUid();

  useEffect(() => {
    if (divisionIndex === null) {
      setStandings([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    loadLeagueStandings(divisionIndex)
      .then((rows) => {
        if (!cancelled) setStandings(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [divisionIndex, profile.weeklyXp]);

  useEffect(() => {
    const id = setInterval(() => setMsLeft(msUntilNextLeagueReset()), 60000);
    return () => clearInterval(id);
  }, []);

  const handleDismissResult = useCallback(async () => {
    await acknowledgeLeagueResult();
    onProfileChange();
  }, [onProfileChange]);

  const accent = tierColorOf(divisionIndex);
  const bands = getDivisionBands(standings.length);
  // Below the minimum size every cutoff collapses to zero (and demoteCutoff to
  // Infinity), which would render as "the top 0 jump two ... the bottom
  // -Infinity drop one". Say the division is too small instead.
  const isRankable = bands.skipCutoff > 0;
  const myRank = standings.findIndex((s) => s.uid === uid) + 1;
  const visible = expanded ? standings : standings.slice(0, VISIBLE_ROWS);

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2" style={{ color: accent }}>
          <Trophy className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">League</h3>
        </div>
        <span className="text-[10px] font-semibold text-textMuted">
          Resets in {formatCountdown(msLeft)}
        </span>
      </div>

      {lastLeagueResult && (
        <div
          className="p-3 rounded-xl border space-y-1.5"
          style={{ borderColor: accent, backgroundColor: `${accent}14` }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-textPrimary">
              {lastLeagueResult.movement === 'promoted' &&
                `Promoted to ${divisionName(lastLeagueResult.toDivision)}!`}
              {lastLeagueResult.movement === 'demoted' &&
                `Demoted to ${divisionName(lastLeagueResult.toDivision)}`}
              {lastLeagueResult.movement === 'held' &&
                `Held ${divisionName(lastLeagueResult.toDivision)}`}
            </span>
            <button
              onClick={handleDismissResult}
              className="text-[10px] font-semibold text-textMuted hover:text-textPrimary transition cursor-pointer shrink-0"
            >
              Dismiss
            </button>
          </div>
          <p className="text-[10px] text-textSecondary">
            You finished #{lastLeagueResult.rank} of {lastLeagueResult.divisionSize} last week
            {lastLeagueResult.snowflakesEarned > 0
              ? ` and earned ${lastLeagueResult.snowflakesEarned} snowflakes.`
              : '.'}
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2"
          style={{ borderColor: accent, backgroundColor: `${accent}1A` }}
        >
          <Shield className="w-7 h-7" style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-bold text-textPrimary truncate">
            {divisionName(divisionIndex)}
          </div>
          <div className="text-[11px] text-textSecondary">
            {divisionIndex === null
              ? 'Complete any activity to rejoin the ladder'
              : `${tierNameOf(divisionIndex)} tier · ${profile.weeklyXp} XP this week${
                  myRank > 0 ? ` · #${myRank}` : ''
                }`}
          </div>
        </div>
      </div>

      {divisionIndex === null ? (
        <p className="text-[11px] text-textMuted leading-relaxed">
          You dropped off the ladder after a month away. Your next completed activity puts you
          straight back into {divisionName(profile.lastRankedDivision)}.
        </p>
      ) : loading ? (
        <p className="text-xs text-textMuted py-2">Loading standings...</p>
      ) : standings.length === 0 ? (
        <p className="text-xs text-textMuted py-2">No one has earned XP in this division yet.</p>
      ) : (
        <>
          <div className="divide-y divide-borderFaint text-xs">
            {visible.map((entry, idx) => {
              const rank = idx + 1;
              const isYou = entry.uid === uid;
              const zone =
                rank <= bands.skipCutoff
                  ? 'skip'
                  : rank <= bands.promoteCutoff
                    ? 'promote'
                    : rank > bands.demoteCutoff
                      ? 'demote'
                      : 'hold';

              return (
                <div
                  key={entry.uid}
                  className={`py-2.5 flex items-center justify-between ${
                    isYou ? 'bg-surfaceHigh -mx-2 px-2 rounded-lg' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-5 text-center font-bold shrink-0"
                      style={{ color: zone === 'hold' ? undefined : accent }}
                    >
                      {rank}
                    </span>
                    {zone === 'skip' && <ChevronUp className="w-3.5 h-3.5 text-success shrink-0" />}
                    {zone === 'promote' && (
                      <ChevronUp className="w-3.5 h-3.5 text-success/50 shrink-0" />
                    )}
                    {zone === 'demote' && (
                      <ChevronDown className="w-3.5 h-3.5 text-danger shrink-0" />
                    )}
                    {zone === 'hold' && <Minus className="w-3.5 h-3.5 text-textMuted shrink-0" />}
                    <span
                      className={`truncate ${isYou ? 'font-bold text-accent' : 'text-textSecondary'}`}
                    >
                      {isYou ? 'You' : `Learner ${entry.uid.slice(-4)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-textMuted shrink-0">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {entry.streakCount}
                    </span>
                    <span className="font-bold text-textPrimary w-14 text-right">
                      {entry.weeklyXp} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {standings.length > VISIBLE_ROWS && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full py-1.5 rounded-lg text-[11px] font-semibold text-textSecondary bg-surfaceHigh hover:bg-border transition cursor-pointer"
            >
              {expanded ? 'Show less' : `Show all ${standings.length}`}
            </button>
          )}
        </>
      )}

      {divisionIndex !== null && standings.length > 0 && (
        <p className="text-[10px] text-textMuted leading-relaxed">
          {isRankable ? (
            <>
              Every XP you earn this week counts. At Sunday midnight IST the top{' '}
              {bands.skipCutoff} jump two divisions, the next{' '}
              {bands.promoteCutoff - bands.skipCutoff} move up one, and the bottom{' '}
              {standings.length - bands.demoteCutoff} drop one.
            </>
          ) : (
            <>
              This division is still filling up, so nobody moves at Sunday midnight IST yet. Keep
              earning XP -- once there are enough players, the top of the board climbs and the
              bottom drops.
            </>
          )}{' '}
          Climbing pays{' '}
          {snowflakesForPromotion(divisionIndex, Math.min(MAX_DIVISION, divisionIndex + 1))}{' '}
          snowflakes a division.
        </p>
      )}
    </div>
  );
};
