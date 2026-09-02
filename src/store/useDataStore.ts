import { useState, useCallback, useEffect } from 'react';
import { DailyProgress, InterviewDifficulty, LocalProfile } from '../types';
import { DEFAULT_DAILY_PROGRESS, DEFAULT_PROFILE, getTodayDateString } from './localStore';
import {
  loadDailyProgress,
  loadProfile,
  markContentAsViewed,
  recordBattleResult as recordBattleResultInFirestore,
  recordDebugChallengeResult as recordDebugChallengeResultInFirestore,
  recordMatrixRoundResult as recordMatrixRoundResultInFirestore,
  recordSpeedRoundResult as recordSpeedRoundResultInFirestore,
  reconcileWeeklyAchievement,
  saveProfile,
} from './firestoreStore';

export function useDataStore() {
  const [profile, setProfile] = useState<LocalProfile>(DEFAULT_PROFILE);
  const [todayDate] = useState<string>(getTodayDateString);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(DEFAULT_DAILY_PROGRESS);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const updated = await loadProfile();
    setProfile(updated);
    return updated;
  }, []);

  const refreshDailyProgress = useCallback(async (dateStr?: string) => {
    const target = dateStr || getTodayDateString();
    const updated = await loadDailyProgress(target);
    setDailyProgress(updated);
    return updated;
  }, []);

  const updateProfile = useCallback(async (newProfile: LocalProfile) => {
    await saveProfile(newProfile);
    setProfile(newProfile);
  }, []);

  const markContentViewed = useCallback(
    async (dateStr: string, key: keyof DailyProgress) => {
      const { updatedProgress, updatedProfile, surpriseXp } = await markContentAsViewed(dateStr, key);
      setDailyProgress(updatedProgress);
      setProfile(updatedProfile);
      return { surpriseXp };
    },
    []
  );

  const recordBattleResult = useCallback(
    async (won: boolean, difficulty: InterviewDifficulty = 'mid') => {
      const res = await recordBattleResultInFirestore(won, difficulty);
      setProfile(await loadProfile());
      return res;
    },
    []
  );

  const recordSpeedRoundResult = useCallback(
    async (correctCount: number, totalAnswered: number) => {
      const res = await recordSpeedRoundResultInFirestore(correctCount, totalAnswered);
      setProfile(await loadProfile());
      return res;
    },
    []
  );

  const recordDebugChallengeResult = useCallback(async (correct: boolean) => {
    const res = await recordDebugChallengeResultInFirestore(correct);
    setProfile(await loadProfile());
    return res;
  }, []);

  const recordMatrixRoundResult = useCallback(async (timeMs: number, mistakes: number) => {
    const res = await recordMatrixRoundResultInFirestore(timeMs, mistakes);
    setProfile(await loadProfile());
    return res;
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([refreshProfile(), refreshDailyProgress(todayDate)]);
      setLoading(false);
      // Fire-and-forget: catches up any fully-elapsed, unscored weeks toward
      // the Year Achievement. Cheap no-op most days; never blocks the UI.
      const weeklyResult = await reconcileWeeklyAchievement();
      if (weeklyResult.weeksReconciled > 0) {
        refreshProfile();
      }
    })();
  }, [refreshProfile, refreshDailyProgress, todayDate]);

  return {
    profile,
    todayDate,
    dailyProgress,
    loading,
    refreshProfile,
    refreshDailyProgress,
    saveProfile: updateProfile,
    markContentViewed,
    recordBattleResult,
    recordSpeedRoundResult,
    recordDebugChallengeResult,
    recordMatrixRoundResult,
  };
}
