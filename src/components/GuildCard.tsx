import React, { useEffect, useState } from 'react';
import { GuildData, LocalProfile } from '../types';
import { createGuild, joinGuild, leaveGuild, loadMyGuild } from '../store/firestoreStore';
import { getOrCreateUid } from '../store/localStore';
import { Users, Copy, Check, LogOut, Flame } from 'lucide-react';

interface GuildCardProps {
  profile: LocalProfile;
  onProfileChange: () => void;
}

export const GuildCard: React.FC<GuildCardProps> = ({ profile, onProfileChange }) => {
  const [guild, setGuild] = useState<GuildData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [nameInput, setNameInput] = useState<string>('');
  const [codeInput, setCodeInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);

  const refreshGuild = async () => {
    setLoading(true);
    try {
      const g = await loadMyGuild();
      setGuild(g);
    } catch (e) {
      console.error('Failed to load guild:', e);
      setGuild(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshGuild();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.guildCode]);

  const handleCreate = async () => {
    if (!nameInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createGuild(nameInput.trim());
      onProfileChange();
    } catch (e) {
      console.error('Failed to create guild:', e);
      setError('Could not create a guild right now. Please try again shortly.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoin = async () => {
    if (!codeInput.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await joinGuild(codeInput.trim());
      if (!res.success) {
        setError(res.error ?? 'Could not join that guild.');
        return;
      }
      onProfileChange();
    } catch (e) {
      console.error('Failed to join guild:', e);
      setError('Could not join right now. Please try again shortly.');
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    setBusy(true);
    try {
      await leaveGuild();
      onProfileChange();
    } catch (e) {
      console.error('Failed to leave guild:', e);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = async () => {
    if (!guild) return;
    try {
      await navigator.clipboard.writeText(guild.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy guild code:', e);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg">
        <p className="text-xs text-textMuted">Loading guild...</p>
      </div>
    );
  }

  if (!guild) {
    return (
      <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-accent2">
          <Users className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-textSecondary">Guild</h3>
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Guild name"
              maxLength={30}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-sm text-textPrimary placeholder:text-textMuted"
            />
            <button
              onClick={handleCreate}
              disabled={busy || !nameInput.trim()}
              className="px-4 py-2 rounded-lg font-bold text-xs bg-accent text-background hover:bg-accent2 hover:text-white transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              Create
            </button>
          </div>

          <div className="flex gap-2">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Have a code? Join here"
              maxLength={6}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-background border border-border text-sm text-textPrimary placeholder:text-textMuted uppercase"
            />
            <button
              onClick={handleJoin}
              disabled={busy || !codeInput.trim()}
              className="px-4 py-2 rounded-lg font-bold text-xs border-2 border-accent2 text-accent2 hover:bg-accent2/10 transition disabled:opacity-50 cursor-pointer shrink-0"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  const combinedStreak = guild.members.reduce((sum, m) => sum + m.streakCount, 0);
  const goalProgress = Math.min(100, (combinedStreak / guild.streakGoal) * 100);
  const myUid = getOrCreateUid();

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent2">
          <Users className="w-4 h-4" />
          <h3 className="text-sm font-bold text-textPrimary">{guild.name}</h3>
        </div>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1 text-[10px] font-mono font-bold text-textMuted hover:text-accent2 transition cursor-pointer"
        >
          {codeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {guild.code}
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-textMuted font-semibold">
          <span>Combined Streak</span>
          <span>{combinedStreak} / {guild.streakGoal}</span>
        </div>
        <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
          <div
            className="h-full bg-gradient-to-r from-accent2 to-success transition-all duration-700"
            style={{ width: `${goalProgress}%` }}
          />
        </div>
      </div>

      <div className="divide-y divide-borderFaint text-xs">
        {guild.members.map((m) => (
          <div key={m.uid} className="py-2 flex items-center justify-between">
            <span className={m.uid === myUid ? 'font-bold text-accent' : 'text-textSecondary'}>
              {m.uid === myUid ? 'You' : `Learner ${m.uid.slice(-4)}`}
            </span>
            <span className="flex items-center gap-1 text-textMuted">
              <Flame className="w-3 h-3" />
              {m.streakCount}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={handleLeave}
        disabled={busy}
        className="w-full py-2 rounded-lg font-bold text-xs border border-border text-textMuted hover:bg-surfaceHigh transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>Leave Guild</span>
      </button>
    </div>
  );
};
