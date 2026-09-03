export interface FluencyStats {
  streakCount: number;
  longestStreak: number;
  level: number;
  xp: number;
  rating: number;
  dsaSolvedCount: number;
  mlConceptsViewedCount: number;
  mlQaViewedCount: number;
  battlesPlayed: number;
  battlesWon: number;
  speedRoundsPlayed: number;
  debugChallengesSolved: number;
  matrixRoundsCompleted: number;
}

export interface FluencyBreakdown {
  consistency: number; // out of 30
  breadth: number; // out of 20
  depth: number; // out of 25
  competitive: number; // out of 15
  accuracy: number; // out of 10
}

export interface FluencyScore {
  score: number; // 0-100
  tier: string;
  breakdown: FluencyBreakdown;
}

const TIERS: Array<{ min: number; label: string }> = [
  { min: 81, label: 'Fluent' },
  { min: 61, label: 'Sharp' },
  { min: 41, label: 'Solid Ground' },
  { min: 21, label: 'Building Momentum' },
  { min: 0, label: 'Getting Started' },
];

/**
 * Deterministic 0-100 fluency score. Kept as a transparent formula rather
 * than asking the model to invent a number -- a score has to be consistent
 * run-to-run and explainable when someone asks how it's calculated.
 */
export function computeFluencyScore(stats: FluencyStats): FluencyScore {
  const totalActivities =
    stats.dsaSolvedCount +
    stats.mlConceptsViewedCount +
    stats.mlQaViewedCount +
    stats.battlesPlayed +
    stats.speedRoundsPlayed +
    stats.debugChallengesSolved +
    stats.matrixRoundsCompleted;

  const modesEngaged = [
    stats.dsaSolvedCount,
    stats.mlConceptsViewedCount,
    stats.mlQaViewedCount,
    stats.battlesPlayed,
    stats.speedRoundsPlayed,
    stats.debugChallengesSolved,
    stats.matrixRoundsCompleted,
  ].filter((n) => n > 0).length;

  const winRate = stats.battlesPlayed > 0 ? stats.battlesWon / stats.battlesPlayed : 0;

  const breakdown: FluencyBreakdown = {
    consistency: Math.min(30, stats.streakCount * 3),
    breadth: Math.round((modesEngaged / 7) * 20),
    depth: Math.min(25, Math.floor(totalActivities / 4)),
    competitive: Math.min(15, Math.max(0, Math.round((stats.rating - 1200) / 10))),
    accuracy: Math.round(winRate * 10),
  };

  const score = Math.min(
    100,
    breakdown.consistency + breakdown.breadth + breakdown.depth + breakdown.competitive + breakdown.accuracy
  );

  const tier = TIERS.find((t) => score >= t.min)?.label ?? 'Getting Started';

  return { score, tier, breakdown };
}
