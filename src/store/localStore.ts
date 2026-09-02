import { BattleResult, DailyProgress, InterviewDifficulty, LocalProfile } from '../types';

const UID_KEY = '@aidh/uid';
const PROFILE_KEY = '@aidh/profile';
const DAILY_PREFIX = '@aidh/daily/';

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const DEFAULT_PROFILE: LocalProfile = {
  rating: 1200,
  streakCount: 0,
  longestStreak: 0,
  lastActivityDate: null,
  xp: 0,
  level: 1,
  freezeAvailable: true,
  nextFreezeAt: null,
  guildCode: null,
  stats: {
    battlesPlayed: 0,
    battlesWon: 0,
    battlesLost: 0,
    dsaSolvedCount: 0,
    mlConceptsViewedCount: 0,
    mlQaViewedCount: 0,
    speedRoundsPlayed: 0,
    speedRoundBestScore: 0,
    debugChallengesAttempted: 0,
    debugChallengesSolved: 0,
  },
};

export const DEFAULT_DAILY_PROGRESS: DailyProgress = {
  dsa: false,
  ml_concept: false,
  ml_interview_qa: false,
};

export function getOrCreateUid(): string {
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}

export function loadLocalProfile(): LocalProfile {
  getOrCreateUid();
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
    return { ...DEFAULT_PROFILE };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      stats: {
        ...DEFAULT_PROFILE.stats,
        ...(parsed.stats || {}),
      },
    };
  } catch (e) {
    console.error('Failed to parse local profile:', e);
    return { ...DEFAULT_PROFILE };
  }
}

export function saveLocalProfile(profile: LocalProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadLocalDailyProgress(dateStr: string): DailyProgress {
  const raw = localStorage.getItem(DAILY_PREFIX + dateStr);
  if (!raw) {
    return { ...DEFAULT_DAILY_PROGRESS };
  }
  try {
    return { ...DEFAULT_DAILY_PROGRESS, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_DAILY_PROGRESS };
  }
}

export function saveLocalDailyProgress(dateStr: string, progress: DailyProgress): void {
  localStorage.setItem(DAILY_PREFIX + dateStr, JSON.stringify(progress));
}

export function markContentAsViewedInLocal(
  dateStr: string,
  key: keyof DailyProgress
): { updatedProgress: DailyProgress; updatedProfile: LocalProfile } {
  const currentProgress = loadLocalDailyProgress(dateStr);
  if (currentProgress[key]) {
    // Already marked done
    return { updatedProgress: currentProgress, updatedProfile: loadLocalProfile() };
  }

  const updatedProgress: DailyProgress = {
    ...currentProgress,
    [key]: true,
  };
  saveLocalDailyProgress(dateStr, updatedProgress);

  const profile = loadLocalProfile();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  let streak = profile.streakCount;
  if (profile.lastActivityDate !== todayStr) {
    if (profile.lastActivityDate === yesterdayStr) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  const longest = Math.max(profile.longestStreak, streak);
  const newXp = profile.xp + 10;
  const newLevel = Math.floor(newXp / 100) + 1;

  const newStats = { ...profile.stats };
  if (key === 'dsa') newStats.dsaSolvedCount += 1;
  if (key === 'ml_concept') newStats.mlConceptsViewedCount += 1;
  if (key === 'ml_interview_qa') newStats.mlQaViewedCount += 1;

  const updatedProfile: LocalProfile = {
    ...profile,
    streakCount: streak,
    longestStreak: longest,
    lastActivityDate: todayStr,
    xp: newXp,
    level: newLevel,
    stats: newStats,
  };

  saveLocalProfile(updatedProfile);

  return { updatedProgress, updatedProfile };
}

export function recordBattleResultInLocal(
  won: boolean,
  difficulty: InterviewDifficulty = 'mid'
): BattleResult {
  const profile = loadLocalProfile();
  const oldRating = profile.rating;

  let botRating = 1200;
  if (difficulty === 'junior') botRating = 900;
  if (difficulty === 'senior') botRating = 1500;

  const expected = 1 / (1 + Math.pow(10, (botRating - oldRating) / 400));
  const actual = won ? 1 : 0;
  const newRating = Math.max(100, Math.round(oldRating + 32 * (actual - expected)));
  const ratingDelta = newRating - oldRating;

  const xpEarned = won ? 25 : 5;
  const newXp = profile.xp + xpEarned;
  const newLevel = Math.floor(newXp / 100) + 1;

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  let streak = profile.streakCount;
  if (profile.lastActivityDate !== todayStr) {
    if (profile.lastActivityDate === yesterdayStr) {
      streak += 1;
    } else {
      streak = 1;
    }
  }

  const updatedProfile: LocalProfile = {
    ...profile,
    rating: newRating,
    streakCount: streak,
    longestStreak: Math.max(profile.longestStreak, streak),
    lastActivityDate: todayStr,
    xp: newXp,
    level: newLevel,
    stats: {
      ...profile.stats,
      battlesPlayed: profile.stats.battlesPlayed + 1,
      battlesWon: won ? profile.stats.battlesWon + 1 : profile.stats.battlesWon,
      battlesLost: !won ? profile.stats.battlesLost + 1 : profile.stats.battlesLost,
    },
  };

  saveLocalProfile(updatedProfile);

  return {
    won,
    oldRating,
    newRating,
    ratingDelta,
    xpEarned,
  };
}
