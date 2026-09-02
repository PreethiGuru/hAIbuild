import React, { useState } from 'react';
import { LocalProfile, MAX_ITEM_STACK } from '../types';
import { buyStreakFreeze, buyXpBooster, SHOP_PRICES } from '../store/firestoreStore';
import { ShoppingBag, Snowflake, Zap } from 'lucide-react';

interface ShopCardProps {
  profile: LocalProfile;
  onProfileChange: () => void;
}

export const ShopCard: React.FC<ShopCardProps> = ({ profile, onProfileChange }) => {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'freeze' | 'booster' | null>(null);

  const handleBuyFreeze = async () => {
    setBusy('freeze');
    setError(null);
    const res = await buyStreakFreeze();
    setBusy(null);
    if (!res.success) {
      setError(res.error ?? 'Could not buy a streak freeze.');
      return;
    }
    onProfileChange();
  };

  const handleBuyBooster = async () => {
    setBusy('booster');
    setError(null);
    const res = await buyXpBooster();
    setBusy(null);
    if (!res.success) {
      setError(res.error ?? 'Could not buy an XP booster.');
      return;
    }
    onProfileChange();
  };

  return (
    <div className="bg-surface p-5 rounded-2xl border border-border shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent2">
          <ShoppingBag className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-textMuted">Shop</h3>
        </div>
        <div className="flex items-center gap-1 text-sm font-bold text-accent2">
          <Snowflake className="w-4 h-4" />
          {profile.snowflakes}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl border border-border bg-surfaceHigh space-y-2">
          <div className="flex items-center gap-1.5 text-accent2">
            <Snowflake className="w-4 h-4" />
            <span className="text-xs font-bold text-textPrimary">Streak Freeze</span>
          </div>
          <p className="text-[10px] text-textMuted">Held: {profile.streakFreezeCount} / {MAX_ITEM_STACK}</p>
          <button
            onClick={handleBuyFreeze}
            disabled={busy === 'freeze' || profile.streakFreezeCount >= MAX_ITEM_STACK}
            className="w-full py-1.5 rounded-lg text-xs font-bold bg-accent2 text-white hover:bg-accent2/80 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Buy for {SHOP_PRICES.streakFreeze} ❄
          </button>
        </div>

        <div className="p-3 rounded-xl border border-border bg-surfaceHigh space-y-2">
          <div className="flex items-center gap-1.5 text-warning">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold text-textPrimary">XP Booster</span>
          </div>
          <p className="text-[10px] text-textMuted">Held: {profile.xpBoosterCount} / {MAX_ITEM_STACK}</p>
          <button
            onClick={handleBuyBooster}
            disabled={busy === 'booster' || profile.xpBoosterCount >= MAX_ITEM_STACK}
            className="w-full py-1.5 rounded-lg text-xs font-bold bg-warning text-background hover:bg-warning/80 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Buy for {SHOP_PRICES.xpBooster} ❄
          </button>
        </div>
      </div>

      <p className="text-[10px] text-textMuted leading-relaxed">
        Each XP Booster doubles the XP from your next completed activity. Streak Freezes save your
        streak automatically when you miss a day.
      </p>
    </div>
  );
};
