import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { BattleResult, ClaimBadgeResult, DailyProgress, DebugChallengeResult, DuelData, GuildData, InterviewDifficulty, JoinGuildResult, LeaderboardEntry, LocalProfile, MatrixRoundResult, MAX_ITEM_STACK, ShopPurchaseResult, SpeedRoundResult, WeeklyReconcileResult } from '../types';
import {
  DEFAULT_DAILY_PROGRESS,
  DEFAULT_PROFILE,
  formatDateString,
  getDatesForWeekIndex,
  getDateStringDaysAgo,
  getOrCreateUid,
  getTodayDateString,
  getWeekIndex,
  getYesterdayDateString,
} from './localStore';

function profileRef(uid: string) {
  return doc(db, 'users', uid);
}

function dailyProgressRef(uid: string, dateStr: string) {
  return doc(db, 'users', uid, 'dailyProgress', dateStr);
}

/**
 * Advances streak/longestStreak and freeze inventory for a new day of
 * activity. A missed day only breaks the streak if a freeze is held; that
 * consumes one charge. Free weekly regeneration tops the count back up (to
 * the shared MAX_ITEM_STACK cap) independently of shop purchases. Shared by
 * every activity that should count toward the daily streak.
 */
function advanceStreak(
  profile: LocalProfile,
  todayStr: string,
  yesterdayStr: string
): Pick<LocalProfile, 'streakCount' | 'longestStreak' | 'streakFreezeCount' | 'nextFreezeGrantAt'> {
  let streak = profile.streakCount;
  let freezeCount = profile.streakFreezeCount;
  let nextFreezeGrantAt = profile.nextFreezeGrantAt;

  if (profile.lastActivityDate !== todayStr) {
    if (profile.lastActivityDate === yesterdayStr) {
      streak += 1;
    } else if (freezeCount > 0 && profile.streakCount > 0) {
      // A day was missed, but a freeze covers it: streak continues uninterrupted.
      streak += 1;
      freezeCount -= 1;
    } else {
      streak = 1;
    }
  }

  if (freezeCount < MAX_ITEM_STACK) {
    if (!nextFreezeGrantAt) {
      const next = new Date();
      next.setDate(next.getDate() + 7);
      nextFreezeGrantAt = formatDateString(next);
    } else if (todayStr >= nextFreezeGrantAt) {
      freezeCount = Math.min(MAX_ITEM_STACK, freezeCount + 1);
      const next = new Date();
      next.setDate(next.getDate() + 7);
      nextFreezeGrantAt = formatDateString(next);
    }
  }

  return {
    streakCount: streak,
    longestStreak: Math.max(profile.longestStreak, streak),
    streakFreezeCount: freezeCount,
    nextFreezeGrantAt,
  };
}

/**
 * Applies XP, consuming one XP-booster charge (if held) to double this
 * specific gain. Centralized so every reward path applies boosters the same
 * way instead of five separate ad-hoc implementations.
 */
function applyXp(
  profile: LocalProfile,
  baseAmount: number
): { xp: number; level: number; xpBoosterCount: number; effectiveAmount: number } {
  const boosted = baseAmount > 0 && profile.xpBoosterCount > 0;
  const effectiveAmount = boosted ? baseAmount * 2 : baseAmount;
  const xp = profile.xp + effectiveAmount;
  return {
    xp,
    level: Math.floor(xp / 100) + 1,
    xpBoosterCount: boosted ? profile.xpBoosterCount - 1 : profile.xpBoosterCount,
    effectiveAmount,
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
  const xpGain = applyXp(profile, 10 + (gotSurpriseDrop ? SURPRISE_DROP_XP : 0));

  const newStats = { ...profile.stats };
  if (key === 'dsa') newStats.dsaSolvedCount += 1;
  if (key === 'ml_concept') newStats.mlConceptsViewedCount += 1;
  if (key === 'ml_interview_qa') newStats.mlQaViewedCount += 1;

  const updatedProfile: LocalProfile = {
    ...profile,
    ...streakUpdate,
    lastActivityDate: todayStr,
    xp: xpGain.xp,
    level: xpGain.level,
    xpBoosterCount: xpGain.xpBoosterCount,
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

  const baseXp = won ? 25 : 5;

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const streakUpdate = advanceStreak(profile, todayStr, yesterdayStr);
  const xpGain = applyXp(profile, baseXp);

  const updatedProfile: LocalProfile = {
    ...profile,
    rating: newRating,
    ...streakUpdate,
    lastActivityDate: todayStr,
    xp: xpGain.xp,
    level: xpGain.level,
    xpBoosterCount: xpGain.xpBoosterCount,
    stats: {
      ...profile.stats,
      battlesPlayed: profile.stats.battlesPlayed + 1,
      battlesWon: won ? profile.stats.battlesWon + 1 : profile.stats.battlesWon,
      battlesLost: !won ? profile.stats.battlesLost + 1 : profile.stats.battlesLost,
    },
  };

  await saveProfile(updatedProfile);

  return { won, oldRating, newRating, ratingDelta, xpEarned: xpGain.effectiveAmount };
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

  const baseXp = correctCount * SPEED_ROUND_XP_PER_CORRECT;
  const xpGain = applyXp(profile, baseXp);
  const isNewBest = correctCount > profile.stats.speedRoundBestScore;

  const updatedProfile: LocalProfile = {
    ...profile,
    ...streakUpdate,
    lastActivityDate: todayStr,
    xp: xpGain.xp,
    level: xpGain.level,
    xpBoosterCount: xpGain.xpBoosterCount,
    stats: {
      ...profile.stats,
      speedRoundsPlayed: profile.stats.speedRoundsPlayed + 1,
      speedRoundBestScore: Math.max(profile.stats.speedRoundBestScore, correctCount),
    },
  };

  await saveProfile(updatedProfile);
  return { correctCount, totalAnswered, xpEarned: xpGain.effectiveAmount, isNewBest };
}

const DEBUG_CHALLENGE_XP = 10;

export async function recordDebugChallengeResult(correct: boolean): Promise<DebugChallengeResult> {
  const profile = await loadProfile();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const streakUpdate = advanceStreak(profile, todayStr, yesterdayStr);

  const baseXp = correct ? DEBUG_CHALLENGE_XP : 0;
  const xpGain = applyXp(profile, baseXp);

  const updatedProfile: LocalProfile = {
    ...profile,
    ...streakUpdate,
    lastActivityDate: todayStr,
    xp: xpGain.xp,
    level: xpGain.level,
    xpBoosterCount: xpGain.xpBoosterCount,
    stats: {
      ...profile.stats,
      debugChallengesAttempted: profile.stats.debugChallengesAttempted + 1,
      debugChallengesSolved: profile.stats.debugChallengesSolved + (correct ? 1 : 0),
    },
  };

  await saveProfile(updatedProfile);
  return { correct, xpEarned: xpGain.effectiveAmount };
}

const GUILD_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 -- easy to read aloud
const DEFAULT_GUILD_STREAK_GOAL = 100;

function guildRef(code: string) {
  return doc(db, 'guilds', code);
}

function generateGuildCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += GUILD_CODE_CHARS[Math.floor(Math.random() * GUILD_CODE_CHARS.length)];
  }
  return code;
}

export async function createGuild(name: string): Promise<{ code: string }> {
  const uid = getOrCreateUid();
  const code = generateGuildCode();

  await setDoc(guildRef(code), {
    name,
    streakGoal: DEFAULT_GUILD_STREAK_GOAL,
    memberUids: [uid],
    createdAt: new Date().toISOString(),
  });

  const profile = await loadProfile();
  await saveProfile({ ...profile, guildCode: code });

  return { code };
}

export async function joinGuild(code: string): Promise<JoinGuildResult> {
  const normalizedCode = code.trim().toUpperCase();
  const snap = await getDoc(guildRef(normalizedCode));
  if (!snap.exists()) {
    return { success: false, error: 'No guild found with that code.' };
  }

  const uid = getOrCreateUid();
  await updateDoc(guildRef(normalizedCode), { memberUids: arrayUnion(uid) });

  const profile = await loadProfile();
  await saveProfile({ ...profile, guildCode: normalizedCode });

  return { success: true };
}

export async function leaveGuild(): Promise<void> {
  const profile = await loadProfile();
  if (!profile.guildCode) return;

  const uid = getOrCreateUid();
  await updateDoc(guildRef(profile.guildCode), { memberUids: arrayRemove(uid) });
  await saveProfile({ ...profile, guildCode: null });
}

export async function loadMyGuild(): Promise<GuildData | null> {
  const profile = await loadProfile();
  if (!profile.guildCode) return null;

  const snap = await getDoc(guildRef(profile.guildCode));
  if (!snap.exists()) return null;

  const data = snap.data();
  const memberUids: string[] = data.memberUids ?? [];

  const memberSnaps = await Promise.all(memberUids.map((uid) => getDoc(profileRef(uid))));
  const members = memberSnaps
    .filter((s) => s.exists())
    .map((s) => {
      const d = s.data()!;
      return { uid: s.id, streakCount: d.streakCount ?? 0, rating: d.rating ?? 1200 };
    });

  return {
    code: profile.guildCode,
    name: data.name ?? 'Unnamed Guild',
    streakGoal: data.streakGoal ?? DEFAULT_GUILD_STREAK_GOAL,
    members,
  };
}

export async function recordMatrixRoundResult(
  timeMs: number,
  mistakes: number
): Promise<MatrixRoundResult> {
  const profile = await loadProfile();
  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();
  const streakUpdate = advanceStreak(profile, todayStr, yesterdayStr);

  const baseXp = Math.max(5, 20 - mistakes * 2);
  const xpGain = applyXp(profile, baseXp);
  const isNewBest = profile.stats.matrixBestTimeMs === 0 || timeMs < profile.stats.matrixBestTimeMs;

  const updatedProfile: LocalProfile = {
    ...profile,
    ...streakUpdate,
    lastActivityDate: todayStr,
    xp: xpGain.xp,
    level: xpGain.level,
    xpBoosterCount: xpGain.xpBoosterCount,
    stats: {
      ...profile.stats,
      matrixRoundsCompleted: profile.stats.matrixRoundsCompleted + 1,
      matrixBestTimeMs: isNewBest ? timeMs : profile.stats.matrixBestTimeMs,
    },
  };

  await saveProfile(updatedProfile);
  return { timeMs, mistakes, xpEarned: xpGain.effectiveAmount, isNewBest };
}

function duelRef(duelId: string) {
  return doc(db, 'duels', duelId);
}

function generateDuelId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function createDuel(questionId: string): Promise<{ duelId: string }> {
  const uid = getOrCreateUid();
  const duelId = generateDuelId();

  await setDoc(duelRef(duelId), {
    questionId,
    creatorUid: uid,
    creatorResult: null,
    opponentUid: null,
    opponentResult: null,
  });

  return { duelId };
}

/**
 * Records the caller's result against a duel. Not transactional -- for a
 * hackathon-scale, low-concurrency "share a link with one friend" flow, the
 * read-then-write race window is an accepted simplification, not an oversight.
 */
export async function submitDuelResult(
  duelId: string,
  won: boolean,
  timeMs: number
): Promise<DuelData | null> {
  const uid = getOrCreateUid();
  const snap = await getDoc(duelRef(duelId));
  if (!snap.exists()) return null;

  const data = snap.data();
  const isCreator = data.creatorUid === uid;
  const result = { won, timeMs };

  if (isCreator) {
    await updateDoc(duelRef(duelId), { creatorResult: result });
  } else {
    await updateDoc(duelRef(duelId), { opponentUid: uid, opponentResult: result });
  }

  const updatedSnap = await getDoc(duelRef(duelId));
  const updated = updatedSnap.data()!;
  return {
    id: duelId,
    questionId: updated.questionId,
    creatorUid: updated.creatorUid,
    creatorResult: updated.creatorResult ?? null,
    opponentUid: updated.opponentUid ?? null,
    opponentResult: updated.opponentResult ?? null,
  };
}

export const SHOP_PRICES = {
  streakFreeze: 50,
  xpBooster: 30,
} as const;

export async function buyStreakFreeze(): Promise<ShopPurchaseResult> {
  const profile = await loadProfile();
  if (profile.streakFreezeCount >= MAX_ITEM_STACK) {
    return { success: false, error: `You can only hold ${MAX_ITEM_STACK} streak freezes at once.` };
  }
  if (profile.snowflakes < SHOP_PRICES.streakFreeze) {
    return { success: false, error: 'Not enough snowflakes.' };
  }
  await saveProfile({
    ...profile,
    snowflakes: profile.snowflakes - SHOP_PRICES.streakFreeze,
    streakFreezeCount: profile.streakFreezeCount + 1,
  });
  return { success: true };
}

export async function buyXpBooster(): Promise<ShopPurchaseResult> {
  const profile = await loadProfile();
  if (profile.xpBoosterCount >= MAX_ITEM_STACK) {
    return { success: false, error: `You can only hold ${MAX_ITEM_STACK} XP boosters at once.` };
  }
  if (profile.snowflakes < SHOP_PRICES.xpBooster) {
    return { success: false, error: 'Not enough snowflakes.' };
  }
  await saveProfile({
    ...profile,
    snowflakes: profile.snowflakes - SHOP_PRICES.xpBooster,
    xpBoosterCount: profile.xpBoosterCount + 1,
  });
  return { success: true };
}

export async function claimBadgeReward(badgeId: string, snowflakeReward: number): Promise<ClaimBadgeResult> {
  const profile = await loadProfile();
  if (profile.claimedBadgeIds.includes(badgeId)) {
    return { success: false, snowflakesEarned: 0 };
  }
  await saveProfile({
    ...profile,
    snowflakes: profile.snowflakes + snowflakeReward,
    claimedBadgeIds: [...profile.claimedBadgeIds, badgeId],
  });
  return { success: true, snowflakesEarned: snowflakeReward };
}

export const MONTHLY_BADGE_WINDOW_DAYS = 30;
export const MONTHLY_BADGE_THRESHOLD = 25;

async function countFullDaysInRange(uid: string, dates: string[]): Promise<number> {
  const snaps = await Promise.all(dates.map((d) => getDoc(dailyProgressRef(uid, d))));
  return snaps.filter((s) => {
    if (!s.exists()) return false;
    const d = s.data();
    return Boolean(d.dsa && d.ml_concept && d.ml_interview_qa);
  }).length;
}

export async function checkMonthlyChampionEligibility(): Promise<boolean> {
  const uid = getOrCreateUid();
  const dates = Array.from({ length: MONTHLY_BADGE_WINDOW_DAYS }, (_, i) => getDateStringDaysAgo(i));
  const fullDays = await countFullDaysInRange(uid, dates);
  return fullDays >= MONTHLY_BADGE_THRESHOLD;
}

export const WEEKLY_QUALIFYING_DAYS_THRESHOLD = 5;
export const WEEKS_FOR_YEAR_ACHIEVEMENT = 52;
const YEAR_ACHIEVEMENT_SNOWFLAKES = 200;
const MAX_WEEKS_TO_RECONCILE_PER_CALL = 60; // bounds a returning-after-a-long-gap user's read count

/**
 * Walks forward through any fully-elapsed, not-yet-scored weeks (handles a
 * gap in usage, not just consecutive days) and updates the consecutive
 * qualifying-week streak toward the 52-week Year Achievement. Call once per
 * app load; cheap no-op (zero extra reads) once the previous week is
 * already reconciled.
 */
export async function reconcileWeeklyAchievement(): Promise<WeeklyReconcileResult> {
  const uid = getOrCreateUid();
  const profile = await loadProfile();

  const currentWeekIndex = getWeekIndex(getTodayDateString());
  let weekIndexToCheck =
    profile.lastReconciledWeekIndex === null ? currentWeekIndex - 1 : profile.lastReconciledWeekIndex + 1;

  let weeklyQualifyingStreak = profile.weeklyQualifyingStreak;
  let yearAchievementCount = profile.yearAchievementCount;
  let snowflakesEarned = 0;
  let weeksReconciled = 0;
  let yearAchievementEarned = false;

  while (weekIndexToCheck < currentWeekIndex && weeksReconciled < MAX_WEEKS_TO_RECONCILE_PER_CALL) {
    const fullDays = await countFullDaysInRange(uid, getDatesForWeekIndex(weekIndexToCheck));

    weeklyQualifyingStreak = fullDays >= WEEKLY_QUALIFYING_DAYS_THRESHOLD ? weeklyQualifyingStreak + 1 : 0;

    if (weeklyQualifyingStreak >= WEEKS_FOR_YEAR_ACHIEVEMENT) {
      yearAchievementCount += 1;
      weeklyQualifyingStreak = 0;
      snowflakesEarned += YEAR_ACHIEVEMENT_SNOWFLAKES;
      yearAchievementEarned = true;
    }

    weeksReconciled += 1;
    weekIndexToCheck += 1;
  }

  if (weeksReconciled > 0) {
    await saveProfile({
      ...profile,
      weeklyQualifyingStreak,
      lastReconciledWeekIndex: weekIndexToCheck - 1,
      yearAchievementCount,
      snowflakes: profile.snowflakes + snowflakesEarned,
    });
  }

  return { weeksReconciled, yearAchievementEarned };
}
