import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BattleResult, DailyProgress, InterviewDifficulty, LocalProfile } from '../types';
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

export async function markContentAsViewed(
  dateStr: string,
  key: keyof DailyProgress
): Promise<{ updatedProgress: DailyProgress; updatedProfile: LocalProfile }> {
  const currentProgress = await loadDailyProgress(dateStr);
  if (currentProgress[key]) {
    return { updatedProgress: currentProgress, updatedProfile: await loadProfile() };
  }

  const updatedProgress: DailyProgress = { ...currentProgress, [key]: true };
  await saveDailyProgress(dateStr, updatedProgress);

  const profile = await loadProfile();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  let streak = profile.streakCount;
  if (profile.lastActivityDate !== todayStr) {
    streak = profile.lastActivityDate === yesterdayStr ? streak + 1 : 1;
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

  await saveProfile(updatedProfile);
  return { updatedProgress, updatedProfile };
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

  let streak = profile.streakCount;
  if (profile.lastActivityDate !== todayStr) {
    streak = profile.lastActivityDate === yesterdayStr ? streak + 1 : 1;
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

  await saveProfile(updatedProfile);

  return { won, oldRating, newRating, ratingDelta, xpEarned };
}
