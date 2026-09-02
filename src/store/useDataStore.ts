import { useState, useCallback, useEffect } from 'react';
import { DailyProgress, InterviewDifficulty, LocalProfile } from '../types';
import { DEFAULT_DAILY_PROGRESS, DEFAULT_PROFILE, getTodayDateString } from './localStore';
import {
  loadDailyProgress,
  loadProfile,
  markContentAsViewed,
  recordBattleResult as recordBattleResultInFirestore,
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

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([refreshProfile(), refreshDailyProgress(todayDate)]);
      setLoading(false);
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
  };
}
