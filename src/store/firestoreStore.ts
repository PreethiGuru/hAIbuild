import { collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BattleResult, DailyProgress, DebugChallengeResult, InterviewDifficulty, LeaderboardEntry, LocalProfile, SpeedRoundResult } from '../types';
import {
  DEFAULT_DAILY_PROGRESS,
  DEFAULT_PROFILE,
  getOrCreateUid,
  getTodayDateString,
  getYesterdayDateString,
} from './localStore';

function profileRef(uid: string) {
  return doc(db, 'users', uid);
}

function dailyProgressRef(uid: string, dateStr: string) {
  return doc(db, 'users', uid, 'dailyProgress', dateStr);
}

function formatDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Advances streak/longestStreak and freeze state for a new day of activity.
 * A missed day only breaks the streak if no freeze is available; spending one
 * schedules the next grant 7 days out. Shared by every activity that should
 * count toward the daily streak (content viewed, battles played).
 */
function advanceStreak(
  profile: LocalProfile,
  todayStr: string,
  yesterdayStr: string
): Pick<LocalProfile, 'streakCount' | 'longestStreak' | 'freezeAvailable' | 'nextFreezeAt'> {
  let streak = profile.streakCount;
  let freezeAvailable = profile.freezeAvailable;
  let nextFreezeAt = profile.nextFreezeAt;

  if (profile.lastActivityDate !== todayStr) {
    if (profile.lastActivityDate === yesterdayStr) {
      streak += 1;
    } else if (freezeAvailable && profile.streakCount > 0) {
      // A day was missed, but a freeze covers it: streak continues uninterrupted.
      streak += 1;
      freezeAvailable = false;
      const next = new Date();
      next.setDate(next.getDate() + 7);
      nextFreezeAt = formatDateString(next);
    } else {
      streak = 1;
    }
  }

  if (!freezeAvailable && nextFreezeAt && todayStr >= nextFreezeAt) {
    freezeAvailable = true;
    nextFreezeAt = null;
  }

  return {
    streakCount: streak,
    longestStreak: Math.max(profile.longestStreak, streak),
    freezeAvailable,
    nextFreezeAt,
  };
}

export async function loadProfile(): Promise<LocalProfile> {
  const uid = getOrCreateUid();
  const snap = await getDoc(profileRef(uid));
  if (!snap.exists()) {
    await setDoc(profileRef(uid), DEFAULT_PROFILE);
    return { ...DEFAULT_PROFILE };
  }
  const data = snap.data();
  return {
    ...DEFAULT_PROFILE,
    ...data,
    stats: { ...DEFAULT_PROFILE.stats, ...(data.stats || {}) },
  } as LocalProfile;
}

export async function saveProfile(profile: LocalProfile): Promise<void> {
  const uid = getOrCreateUid();
  await setDoc(profileRef(uid), profile);
}

export async function loadDailyProgress(dateStr: string): Promise<DailyProgress> {
  const uid = getOrCreateUid();
  const snap = await getDoc(dailyProgressRef(uid, dateStr));
  if (!snap.exists()) return { ...DEFAULT_DAILY_PROGRESS };
  return { ...DEFAULT_DAILY_PROGRESS, ...snap.data() } as DailyProgress;
}

export async function saveDailyProgress(dateStr: string, progress: DailyProgress): Promise<void> {
  const uid = getOrCreateUid();
  await setDoc(dailyProgressRef(uid, dateStr), progress);
}

const SURPRISE_DROP_CHANCE = 0.2;
const SURPRISE_DROP_XP = 15;

export async function markContentAsViewed(
  dateStr: string,
  key: keyof DailyProgress
): Promise<{ updatedProgress: DailyProgress; updatedProfile: LocalProfile; surpriseXp?: number }> {
  const currentProgress = await loadDailyProgress(dateStr);
  if (currentProgress[key]) {
    return { updatedProgress: currentProgress, updatedProfile: await loadProfile() };
  }

  const updatedProgress: DailyProgress = { ...currentProgress, [key]: true };
  await saveDailyProgress(dateStr, updatedProgress);

  const profile = await loadProfile();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const streakUpdate = advanceStreak(profile, todayStr, yesterdayStr);

  const gotSurpriseDrop = Math.random() < SURPRISE_DROP_CHANCE;
  const newXp = profile.xp + 10 + (gotSurpriseDrop ? SURPRISE_DROP_XP : 0);
  const newLevel = Math.floor(newXp / 100) + 1;

  const newStats = { ...profile.stats };
  if (key === 'dsa') newStats.dsaSolvedCount += 1;
  if (key === 'ml_concept') newStats.mlConceptsViewedCount += 1;
  if (key === 'ml_interview_qa') newStats.mlQaViewedCount += 1;

  const updatedProfile: LocalProfile = {
    ...profile,
    ...streakUpdate,
    lastActivityDate: todayStr,
    xp: newXp,
    level: newLevel,
    stats: newStats,
  };

  await saveProfile(updatedProfile);
  return {
    updatedProgress,
    updatedProfile,
    surpriseXp: gotSurpriseDrop ? SURPRISE_DROP_XP : undefined,
  };
}

export async function recordBattleResult(
  won: boolean,
  difficulty: InterviewDifficulty = 'mid'
): Promise<BattleResult> {
  const profile = await loadProfile();
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
  const streakUpdate = advanceStreak(profile, todayStr, yesterdayStr);

  const updatedProfile: LocalProfile = {
    ...profile,
    rating: newRating,
    ...streakUpdate,
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

  await saveProfile(updatedProfile);

  return { won, oldRating, newRating, ratingDelta, xpEarned };
}

export async function loadLeaderboard(limitCount: number = 10): Promise<LeaderboardEntry[]> {
  const q = query(collection(db, 'users'), orderBy('rating', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      uid: d.id,
      rating: data.rating ?? 1200,
      streakCount: data.streakCount ?? 0,
      level: data.level ?? 1,
    };
  });
}

const SPEED_ROUND_XP_PER_CORRECT = 2;

export async function recordSpeedRoundResult(
  correctCount: number,
  totalAnswered: number
): Promise<SpeedRoundResult> {
  const profile = await loadProfile();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const streakUpdate = advanceStreak(profile, todayStr, yesterdayStr);

  const xpEarned = correctCount * SPEED_ROUND_XP_PER_CORRECT;
  const newXp = profile.xp + xpEarned;
  const newLevel = Math.floor(newXp / 100) + 1;
  const isNewBest = correctCount > profile.stats.speedRoundBestScore;

  const updatedProfile: LocalProfile = {
    ...profile,
    ...streakUpdate,
    lastActivityDate: todayStr,
    xp: newXp,
    level: newLevel,
    stats: {
      ...profile.stats,
      speedRoundsPlayed: profile.stats.speedRoundsPlayed + 1,
      speedRoundBestScore: Math.max(profile.stats.speedRoundBestScore, correctCount),
    },
  };

  await saveProfile(updatedProfile);
  return { correctCount, totalAnswered, xpEarned, isNewBest };
}

const DEBUG_CHALLENGE_XP = 10;

export async function recordDebugChallengeResult(correct: boolean): Promise<DebugChallengeResult> {
  const profile = await loadProfile();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const streakUpdate = advanceStreak(profile, todayStr, yesterdayStr);

  const xpEarned = correct ? DEBUG_CHALLENGE_XP : 0;
  const newXp = profile.xp + xpEarned;
  const newLevel = Math.floor(newXp / 100) + 1;

  const updatedProfile: LocalProfile = {
    ...profile,
    ...streakUpdate,
    lastActivityDate: todayStr,
    xp: newXp,
    level: newLevel,
    stats: {
      ...profile.stats,
      debugChallengesAttempted: profile.stats.debugChallengesAttempted + 1,
      debugChallengesSolved: profile.stats.debugChallengesSolved + (correct ? 1 : 0),
    },
  };

  await saveProfile(updatedProfile);
  return { correct, xpEarned };
}
