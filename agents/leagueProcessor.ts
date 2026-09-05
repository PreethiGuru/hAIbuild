import { getDb } from './firebaseAdmin';
import {
  compareForRanking,
  computeDivisionOutcomes,
  getLeagueWeekIndex,
  INACTIVITY_DAYS_TO_UNRANK,
  STARTING_DIVISION,
} from '../src/constants/leagues';

/** Firestore caps a batch at 500 writes; stay clear of the edge. */
const MAX_WRITES_PER_BATCH = 450;

export interface LeagueRunSummary {
  weekIndex: number;
  processedAt: string;
  totalUsers: number;
  ranked: number;
  promoted: number;
  demoted: number;
  held: number;
  unranked: number;
  reinstated: number;
  snowflakesAwarded: number;
  alreadyProcessed?: boolean;
}

function daysBetween(fromDateStr: string, toDate: Date): number {
  const from = new Date(fromDateStr + 'T00:00:00Z').getTime();
  if (Number.isNaN(from)) return Number.POSITIVE_INFINITY;
  return Math.floor((toDate.getTime() - from) / 86400000);
}

/**
 * Runs one weekly league settlement: ranks each division by the XP its
 * members earned during the week, promotes and demotes accordingly, pays out
 * Snowflakes for climbing, and clears the weekly totals.
 *
 * Idempotent by design. Cloud Scheduler retries a non-2xx response, and
 * applying promotions twice would corrupt the ladder, so a run is recorded
 * under leagueRuns/{weekIndex} and a second call for the same week is a
 * no-op unless explicitly forced.
 */
export async function processLeagueWeek(options: { force?: boolean } = {}): Promise<LeagueRunSummary> {
  const db = getDb();
  const now = new Date();

  // Scheduled for just after the boundary, so the week that has just closed
  // is the one before the current index.
  const weekIndex = getLeagueWeekIndex(now) - 1;
  const runRef = db.collection('leagueRuns').doc(String(weekIndex));

  if (!options.force) {
    const existing = await runRef.get();
    if (existing.exists) {
      return { ...(existing.data() as LeagueRunSummary), alreadyProcessed: true };
    }
  }

  const usersSnap = await db.collection('users').get();

  type Update = { uid: string; fields: Record<string, unknown> };
  const updates: Update[] = [];
  const byDivision = new Map<number, Array<{ uid: string; weeklyXp: number; xp: number }>>();

  let unranked = 0;
  let reinstated = 0;

  for (const docSnap of usersSnap.docs) {
    const d = docSnap.data();
    const lastActivityDate: string | null = d.lastActivityDate ?? null;
    const idleDays = lastActivityDate === null ? Number.POSITIVE_INFINITY : daysBetween(lastActivityDate, now);
    const divisionIndex: number | null = d.divisionIndex ?? null;
    const lastRankedDivision: number = d.lastRankedDivision ?? divisionIndex ?? STARTING_DIVISION;

    if (idleDays >= INACTIVITY_DAYS_TO_UNRANK) {
      // Dormant for a month: drop off the ladder, but remember where they
      // stood so returning does not mean starting over from Iron 1.
      if (divisionIndex !== null) {
        updates.push({
          uid: docSnap.id,
          fields: {
            divisionIndex: null,
            lastRankedDivision,
            weeklyXp: 0,
            weeklyXpWeekIndex: weekIndex + 1,
          },
        });
        unranked += 1;
      }
      continue;
    }

    if (divisionIndex === null) {
      // Active again after an unrank: re-enter at their old division and be
      // ranked from the coming week, not this one they did not compete in.
      updates.push({
        uid: docSnap.id,
        fields: {
          divisionIndex: lastRankedDivision,
          lastRankedDivision,
          weeklyXp: 0,
          weeklyXpWeekIndex: weekIndex + 1,
        },
      });
      reinstated += 1;
      continue;
    }

    const bucket = byDivision.get(divisionIndex) ?? [];
    bucket.push({ uid: docSnap.id, weeklyXp: d.weeklyXp ?? 0, xp: d.xp ?? 0 });
    byDivision.set(divisionIndex, bucket);
  }

  let promoted = 0;
  let demoted = 0;
  let held = 0;
  let ranked = 0;
  let snowflakesAwarded = 0;

  const snowflakesByUid = new Map<string, number>();
  for (const docSnap of usersSnap.docs) snowflakesByUid.set(docSnap.id, docSnap.data().snowflakes ?? 0);

  for (const [divisionIndex, members] of byDivision) {
    members.sort(compareForRanking);

    const outcomes = computeDivisionOutcomes(members, divisionIndex);
    ranked += outcomes.length;

    outcomes.forEach((outcome, i) => {
      if (outcome.movement === 'promoted') promoted += 1;
      else if (outcome.movement === 'demoted') demoted += 1;
      else held += 1;

      snowflakesAwarded += outcome.snowflakesEarned;

      updates.push({
        uid: outcome.uid,
        fields: {
          divisionIndex: outcome.toDivision,
          lastRankedDivision: outcome.toDivision,
          weeklyXp: 0,
          weeklyXpWeekIndex: weekIndex + 1,
          snowflakes: (snowflakesByUid.get(outcome.uid) ?? 0) + outcome.snowflakesEarned,
          lastLeagueResult: {
            weekIndex,
            rank: i + 1,
            divisionSize: outcomes.length,
            fromDivision: outcome.fromDivision,
            toDivision: outcome.toDivision,
            movement: outcome.movement,
            snowflakesEarned: outcome.snowflakesEarned,
          },
        },
      });
    });
  }

  for (let i = 0; i < updates.length; i += MAX_WRITES_PER_BATCH) {
    const batch = db.batch();
    for (const u of updates.slice(i, i + MAX_WRITES_PER_BATCH)) {
      batch.set(db.collection('users').doc(u.uid), u.fields, { merge: true });
    }
    await batch.commit();
  }

  const summary: LeagueRunSummary = {
    weekIndex,
    processedAt: now.toISOString(),
    totalUsers: usersSnap.size,
    ranked,
    promoted,
    demoted,
    held,
    unranked,
    reinstated,
    snowflakesAwarded,
  };

  await runRef.set(summary);
  return summary;
}
