/**
 * League ladder, shared by the client (display) and the server-side weekly
 * processor. Kept free of any Vite/browser-specific code so the Express
 * bundle can import it too.
 */

export const DIVISIONS = [
  'Iron 1', 'Iron 2', 'Iron 3',
  'Bronze 1', 'Bronze 2', 'Bronze 3',
  'Silver 1', 'Silver 2', 'Silver 3',
  'Gold 1', 'Gold 2', 'Gold 3',
  'Platinum 1', 'Platinum 2', 'Platinum 3',
] as const;

export const TIER_NAMES = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum'] as const;

// Indexed by tier. Hex rather than Tailwind classes because the tier is only
// known at runtime, and Tailwind cannot generate a class from a variable.
export const TIER_COLORS = ['#6B7280', '#B45309', '#94A3B8', '#D4A017', '#0891B2'] as const;

export function tierColorOf(divisionIndex: number | null): string {
  if (divisionIndex === null) return '#80868B';
  return TIER_COLORS[tierIndexOf(divisionIndex)];
}

export const STARTING_DIVISION = 0; // Iron 1
export const MAX_DIVISION = DIVISIONS.length - 1;

/** Days without activity before a player drops out of the ladder entirely. */
export const INACTIVITY_DAYS_TO_UNRANK = 30;

export function divisionName(index: number | null): string {
  if (index === null) return 'Unranked';
  return DIVISIONS[Math.max(0, Math.min(MAX_DIVISION, index))];
}

export function tierIndexOf(divisionIndex: number): number {
  return Math.floor(Math.max(0, Math.min(MAX_DIVISION, divisionIndex)) / 3);
}

export function tierNameOf(divisionIndex: number | null): string {
  if (divisionIndex === null) return 'Unranked';
  return TIER_NAMES[tierIndexOf(divisionIndex)];
}

/**
 * Snowflakes paid for climbing, summed per division crossed and weighted by
 * the tier being entered -- so a two-division skip into Gold pays more than
 * a single step inside Iron. Promotion is the primary currency source.
 */
export function snowflakesForPromotion(fromIndex: number, toIndex: number): number {
  let total = 0;
  for (let d = fromIndex + 1; d <= toIndex; d++) {
    total += 10 + tierIndexOf(d) * 5;
  }
  return total;
}

/**
 * The one ranking order for a division, used by both the standings board and
 * the weekly settlement. Weekly XP decides it; lifetime XP then uid break
 * ties, which matters because most of a division sits on zero early in the
 * week -- and because a deterministic order means a rerun of the settlement
 * reproduces the same result instead of reshuffling players.
 */
export function compareForRanking(
  a: { uid: string; weeklyXp: number; xp: number },
  b: { uid: string; weeklyXp: number; xp: number }
): number {
  return b.weeklyXp - a.weeklyXp || b.xp - a.xp || a.uid.localeCompare(b.uid);
}

export interface DivisionOutcome {
  uid: string;
  fromDivision: number;
  toDivision: number;
  snowflakesEarned: number;
  movement: 'promoted' | 'demoted' | 'held';
}

/**
 * Decides one division's weekly promotions and demotions.
 *
 * Ranked by weekly XP, descending. Top 5 climb two divisions (the skip),
 * the next 5 climb one, the bottom 5 drop one, everyone between holds.
 *
 * The cutoffs scale down for small divisions: with 6 players, a flat "top 5
 * and bottom 5" would promote and demote nearly everyone at once. Each band
 * is therefore capped at a third of the division, which keeps the ladder
 * sane at demo scale as well as at full size.
 */
export interface DivisionBands {
  /** Ranks 1..skipCutoff climb two divisions. 0 when the division is too small to rank. */
  skipCutoff: number;
  /** Ranks skipCutoff+1..promoteCutoff climb one. */
  promoteCutoff: number;
  /** Ranks above demoteCutoff drop one. Infinity when nobody is demoted. */
  demoteCutoff: number;
}

/** A full division: top 5 skip, next 5 climb, bottom 5 drop, the rest hold. */
export const FULL_DIVISION_BAND = 5;

/**
 * The promotion and demotion cutoffs for a division of a given size, shared
 * by the weekly processor and the standings board so the zone markers players
 * see are the rules that actually run.
 *
 * Three bands are in play -- skip, promote, demote -- so the band is a SIXTH
 * of the division, which leaves half the field holding position. Sizing it by
 * a third instead looks reasonable per-band but adds up to two thirds of every
 * division promoted and the remaining third demoted, with nobody holding: the
 * whole population escalates to Platinum within a couple of months and the
 * ladder stops meaning anything. At the intended 30 per division this lands
 * exactly on the top 5 / next 5 / bottom 5 split.
 */
export function getDivisionBands(size: number): DivisionBands {
  if (size < 3) {
    return { skipCutoff: 0, promoteCutoff: 0, demoteCutoff: Number.POSITIVE_INFINITY };
  }
  const band = Math.max(1, Math.min(FULL_DIVISION_BAND, Math.floor(size / 6)));
  return { skipCutoff: band, promoteCutoff: band * 2, demoteCutoff: size - band };
}

/**
 * Decides one division's weekly promotions and demotions, given its members
 * already sorted by weekly XP, highest first.
 */
export function computeDivisionOutcomes(
  ranked: Array<{ uid: string; weeklyXp: number }>,
  divisionIndex: number
): DivisionOutcome[] {
  const { skipCutoff, promoteCutoff, demoteCutoff } = getDivisionBands(ranked.length);

  return ranked.map((r, i) => {
    const rank = i + 1;
    let toDivision = divisionIndex;

    if (rank <= skipCutoff) {
      toDivision = Math.min(MAX_DIVISION, divisionIndex + 2);
    } else if (rank <= promoteCutoff) {
      toDivision = Math.min(MAX_DIVISION, divisionIndex + 1);
    } else if (rank > demoteCutoff) {
      toDivision = Math.max(0, divisionIndex - 1);
    }

    const movement: DivisionOutcome['movement'] =
      toDivision > divisionIndex ? 'promoted' : toDivision < divisionIndex ? 'demoted' : 'held';

    return {
      uid: r.uid,
      fromDivision: divisionIndex,
      toDivision,
      snowflakesEarned: movement === 'promoted' ? snowflakesForPromotion(divisionIndex, toDivision) : 0,
      movement,
    };
  });
}

const MS_PER_WEEK = 604800000;

/**
 * The league week rolls over at Sunday 00:00 IST. Epoch (1970-01-01T00:00Z)
 * was a Thursday, so the generic 7-day bucket index used elsewhere in the app
 * is Thursday-aligned and unusable here. This anchors instead to the first
 * Sunday 00:00 IST after the epoch -- 1970-01-04 00:00 +05:30, i.e.
 * 1970-01-03T18:30:00Z -- so every bucket boundary is a Sunday midnight in
 * India regardless of where the server or the viewer actually is.
 */
const SUNDAY_MIDNIGHT_IST_ANCHOR_MS = 2 * 86400000 + 18 * 3600000 + 30 * 60000;

export function getLeagueWeekIndex(at: Date = new Date()): number {
  return Math.floor((at.getTime() - SUNDAY_MIDNIGHT_IST_ANCHOR_MS) / MS_PER_WEEK);
}

/** Start of the given league week, as a UTC instant. */
export function getLeagueWeekStart(weekIndex: number): Date {
  return new Date(weekIndex * MS_PER_WEEK + SUNDAY_MIDNIGHT_IST_ANCHOR_MS);
}

export function msUntilNextLeagueReset(at: Date = new Date()): number {
  return getLeagueWeekStart(getLeagueWeekIndex(at) + 1).getTime() - at.getTime();
}
