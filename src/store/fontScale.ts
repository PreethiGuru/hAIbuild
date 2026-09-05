/**
 * Reader-controlled text size.
 *
 * Applied by setting the root font size rather than swapping Tailwind classes:
 * every size in the app is already expressed in rem, so one root value scales
 * headings, body copy, badges and spacing together and keeps the layout in
 * proportion. Swapping classes would mean touching every component and would
 * still leave padding and gaps at their original size.
 */

export interface FontScaleLevel {
  label: string;
  rootPx: number;
}

// 16px is the browser default, so the middle entry leaves the app exactly as
// it renders today -- the current size stays the default, with one step either
// side.
export const FONT_SCALE_LEVELS: FontScaleLevel[] = [
  { label: 'Small', rootPx: 14 },
  { label: 'Default', rootPx: 16 },
  { label: 'Large', rootPx: 18 },
];

export const DEFAULT_FONT_SCALE_INDEX = 1;

const STORAGE_KEY = '@aidh/fontScale';

function clampIndex(index: number): number {
  if (!Number.isFinite(index)) return DEFAULT_FONT_SCALE_INDEX;
  return Math.max(0, Math.min(FONT_SCALE_LEVELS.length - 1, Math.round(index)));
}

export function loadFontScaleIndex(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_FONT_SCALE_INDEX;
    return clampIndex(Number(raw));
  } catch {
    // Private browsing and blocked site data both throw here; the default is
    // a perfectly good answer, so never let a preference break startup.
    return DEFAULT_FONT_SCALE_INDEX;
  }
}

export function saveFontScaleIndex(index: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(clampIndex(index)));
  } catch {
    // Preference simply will not persist this session.
  }
}

export function applyFontScale(index: number): void {
  const level = FONT_SCALE_LEVELS[clampIndex(index)];
  document.documentElement.style.fontSize = `${level.rootPx}px`;
}
