import React from 'react';
import { MascotAnimationState, MascotSize } from '../../types';

interface PenguinMascotProps {
  state?: MascotAnimationState;
  size?: MascotSize;
  className?: string;
  showMountain?: boolean;
  progress?: number; // 0 to 100
  level?: number;
}

export type EvolutionTier = 0 | 1 | 2 | 3;

export const EVOLUTION_TIER_NAMES: Record<EvolutionTier, string> = {
  0: 'Hatchling',
  1: 'Scholar',
  2: 'Practitioner',
  3: 'Master',
};

export function getEvolutionTier(level: number): EvolutionTier {
  if (level >= 10) return 3;
  if (level >= 6) return 2;
  if (level >= 3) return 1;
  return 0;
}

export const PenguinMascot: React.FC<PenguinMascotProps> = ({
  state = 'idle',
  size = 'small',
  className = '',
  showMountain = false,
  progress = 0,
  level = 1,
}) => {
  const tier = getEvolutionTier(level);
  const widthMap: Record<MascotSize, number> = {
    small: 80,
    medium: 120,
    large: 160,
  };

  const width = widthMap[size];
  const height = width * (110 / 80);

  // Animation CSS classes based on state
  const getAnimationClass = (animState: MascotAnimationState | string): string => {
    switch (animState) {
      case 'walking':
        return 'animate-penguin-walk';
      case 'celebrating':
        return 'animate-penguin-celebrate';
      case 'climbing':
        return 'animate-penguin-climb';
      case 'idle':
      default:
        return 'animate-penguin-float';
    }
  };

  // Helper SVG component for rendering the standalone Penguin
  const PenguinSvg = ({
    w = 80,
    h = 110,
    animState = 'idle',
    customClass = '',
  }: {
    w?: number;
    h?: number;
    animState?: MascotAnimationState | string;
    customClass?: string;
  }) => {
    const cssClass = customClass || getAnimationClass(animState);

    return (
      <svg
        width={w}
        height={h}
        viewBox="0 0 80 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transform-gpu transition-all duration-300 ${cssClass}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="penguin-shadow" x="-20%" y="-10%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.4" />
          </filter>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E2838" />
            <stop offset="100%" stopColor="#0B1017" />
          </linearGradient>
          <linearGradient id="snowCapGrad" x1="0" y1="0" x2="0" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#B3E5FC" />
          </linearGradient>
        </defs>

        <g filter="url(#penguin-shadow)">
          {/* Feet */}
          <rect x="22" y="98" width="14" height="7" rx="3.5" fill="#F59E0B" />
          <rect x="44" y="98" width="14" height="7" rx="3.5" fill="#F59E0B" />

          {/* Flippers (Left & Right) */}
          <ellipse
            cx="12"
            cy="65"
            rx="6"
            ry="18"
            fill="#161E2E"
            transform="rotate(22 12 65)"
          />
          <ellipse
            cx="68"
            cy="65"
            rx="6"
            ry="18"
            fill="#161E2E"
            transform="rotate(-22 68 65)"
          />

          {/* Main Body */}
          <ellipse cx="40" cy="60" rx="32" ry="42" fill="url(#bodyGradient)" />

          {/* Head */}
          <circle cx="40" cy="32" r="26" fill="url(#bodyGradient)" />

          {/* White Face & Belly Patch */}
          <path
            d="M 40 16 
               C 25 16, 20 28, 20 40 
               C 20 52, 22 88, 40 88 
               C 58 88, 60 52, 60 40 
               C 60 28, 55 16, 40 16 Z"
            fill="#E8F4F8"
          />

          {/* Eyes (Dark pupils) */}
          <circle cx="31" cy="30" r="3" fill="#0F1419" />
          <circle cx="49" cy="30" r="3" fill="#0F1419" />
          <circle cx="32" cy="29" r="1" fill="#FFFFFF" />
          <circle cx="50" cy="29" r="1" fill="#FFFFFF" />

          {/* Blue Glasses (#1E90FF) */}
          <circle cx="31" cy="30" r="8" fill="none" stroke="#1E90FF" strokeWidth="2.5" />
          <circle cx="49" cy="30" r="8" fill="none" stroke="#1E90FF" strokeWidth="2.5" />
          <line x1="39" y1="30" x2="41" y2="30" stroke="#1E90FF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="16" y1="28" x2="23" y2="29" stroke="#1E90FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="57" y1="29" x2="64" y2="28" stroke="#1E90FF" strokeWidth="2" strokeLinecap="round" />

          {/* Orange Beak */}
          <ellipse cx="40" cy="38" rx="6" ry="4" fill="#F59E0B" />

          {/* Cheek Blushes */}
          <ellipse cx="23" cy="36" rx="3.5" ry="2" fill="#FF6B6B" opacity="0.4" />
          <ellipse cx="57" cy="36" rx="3.5" ry="2" fill="#FF6B6B" opacity="0.4" />

          {/* Evolution gear: Scholar (graduation cap) at tier 1-2 */}
          {(tier === 1 || tier === 2) && (
            <g>
              <rect x="29" y="7" width="22" height="5" rx="2" fill="#1E90FF" />
              <polygon points="40,-3 60,4.5 40,12 20,4.5" fill="#161E2E" />
              <line x1="60" y1="4.5" x2="60" y2="14" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="60" cy="15.5" r="2" fill="#F59E0B" />
            </g>
          )}

          {/* Evolution gear: Practitioner scarf at tier 2 */}
          {tier === 2 && (
            <g>
              <path d="M 17 52 Q 40 63 63 52 L 63 58 Q 40 69 17 58 Z" fill="#F59E0B" />
              <rect x="43" y="56" width="7" height="15" rx="2.5" fill="#F59E0B" />
            </g>
          )}

          {/* Evolution gear: Master crown at tier 3 (replaces cap) */}
          {tier === 3 && (
            <g>
              <rect x="27" y="9" width="26" height="6" rx="1.5" fill="#F59E0B" />
              <polygon points="29,9 34,-4 39,9" fill="#F59E0B" />
              <polygon points="35,9 40,-8 45,9" fill="#F59E0B" />
              <polygon points="41,9 46,-4 51,9" fill="#F59E0B" />
              <circle cx="34" cy="-4" r="1.8" fill="#FFD700" />
              <circle cx="40" cy="-8" r="2" fill="#FFD700" />
              <circle cx="46" cy="-4" r="1.8" fill="#FFD700" />
            </g>
          )}
        </g>
      </svg>
    );
  };

  if (!showMountain) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <PenguinSvg w={width} h={height} animState={state} />
      </div>
    );
  }

  // Mountain Mode: Render mountain silhouette with path, milestones, and mini penguin
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Parametric path calculation for penguin position along mountain trail
  const getPenguinPos = (pct: number) => {
    const t = pct / 100;
    if (t <= 0.5) {
      const localT = t / 0.5;
      const x = 270 - localT * 120; // 270 -> 150
      const y = 260 - localT * 120; // 260 -> 140
      return { x, y };
    } else {
      const localT = (t - 0.5) / 0.5;
      const x = 150 - localT * 40;  // 150 -> 110
      const y = 140 - localT * 105; // 140 -> 35
      return { x, y };
    }
  };

  const penguinPos = getPenguinPos(clampedProgress);

  return (
    <div className={`relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden bg-surface border border-border p-2 shadow-xl ${className}`}>
      {/* Mountain Viewport SVG */}
      <svg
        viewBox="0 0 320 300"
        className="w-full h-auto block"
        style={{ aspectRatio: '320/300' }}
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B121E" />
            <stop offset="100%" stopColor="#1A2436" />
          </linearGradient>
          <linearGradient id="mountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E2B3E" />
            <stop offset="100%" stopColor="#0F1722" />
          </linearGradient>
          <linearGradient id="backMountainGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#141E2D" />
            <stop offset="100%" stopColor="#0A0F18" />
          </linearGradient>
        </defs>

        {/* Night Sky Background with subtle stars */}
        <rect width="320" height="300" fill="url(#skyGrad)" rx="12" />
        <circle cx="50" cy="40" r="1.5" fill="#87CEEB" opacity="0.6" />
        <circle cx="280" cy="60" r="1.5" fill="#87CEEB" opacity="0.8" />
        <circle cx="190" cy="25" r="1" fill="#FFFFFF" opacity="0.5" />
        <circle cx="90" cy="80" r="1" fill="#87CEEB" opacity="0.4" />

        {/* Background Mountain */}
        <polygon
          points="180,300 250,110 320,300"
          fill="url(#backMountainGrad)"
        />
        <polygon points="250,110 240,140 250,130 260,140" fill="#2C3D55" opacity="0.5" />

        {/* Main Mountain Silhouette */}
        <polygon
          points="20,300 110,25 290,300"
          fill="url(#mountainGrad)"
        />

        {/* Snow Cap at Summit */}
        <path
          d="M 110 25 L 95 65 Q 105 75 110 60 Q 115 75 125 65 Z"
          fill="#E8F4F8"
        />

        {/* Dotted Trail Path */}
        <path
          d="M 270 260 L 150 140 L 110 35"
          fill="none"
          stroke="#87CEEB"
          strokeWidth="3"
          strokeDasharray="5,5"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* Milestone Dots */}
        {/* 10% Milestone */}
        <circle cx="246" cy="236" r="6" fill="#1A1F2E" stroke="#87CEEB" strokeWidth="2" />
        <circle cx="246" cy="236" r="3" fill="#87CEEB" />

        {/* 50% Milestone */}
        <circle cx="150" cy="140" r="6" fill="#1A1F2E" stroke="#F59E0B" strokeWidth="2" />
        <circle cx="150" cy="140" r="3" fill="#F59E0B" />

        {/* 100% Summit Milestone */}
        <circle cx="110" cy="35" r="7" fill="#1A1F2E" stroke="#26D07C" strokeWidth="2.5" />
        <circle cx="110" cy="35" r="4" fill="#26D07C" />

        {/* Mini Penguin positioned on trail */}
        <g transform={`translate(${penguinPos.x - 12}, ${penguinPos.y - 20}) scale(0.35)`}>
          <PenguinSvg w={80} h={110} animState="climbing" />
        </g>
      </svg>

      {/* Label Overlays as specified in prompt */}
      {/* 100Q at left 13%, top 73% */}
      <div
        className="absolute pointer-events-none px-2 py-0.5 rounded-full bg-surface/90 border border-accent/40 text-[10px] font-semibold text-accent shadow"
        style={{ left: '13%', top: '73%' }}
      >
        100Q
      </div>

      {/* 500Q at left 33%, top 44% */}
      <div
        className="absolute pointer-events-none px-2 py-0.5 rounded-full bg-surface/90 border border-warning/40 text-[10px] font-semibold text-warning shadow"
        style={{ left: '33%', top: '44%' }}
      >
        500Q
      </div>

      {/* Summit / 1,000Q at left 59%, top 8% */}
      <div
        className="absolute pointer-events-none px-2.5 py-0.5 rounded-full bg-surface/90 border border-success/50 text-[10px] font-bold text-success shadow flex items-center gap-1"
        style={{ left: '50%', top: '8%' }}
      >
        <span> Summit / 1,000Q</span>
      </div>
    </div>
  );
};
