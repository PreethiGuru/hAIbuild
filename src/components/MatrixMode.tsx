import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MATRIX_CATEGORIES, MatrixCategory } from '../data/matrixModeCategories';
import { MatrixRoundResult } from '../types';
import { Grid3x3, ArrowLeft, ArrowRight, Trophy, XCircle } from 'lucide-react';

interface Tile {
  term: string;
  categoryName: string;
}

function buildRound(): { target: MatrixCategory; tiles: Tile[] } {
  const target = MATRIX_CATEGORIES[Math.floor(Math.random() * MATRIX_CATEGORIES.length)];
  const tiles: Tile[] = MATRIX_CATEGORIES.flatMap((cat) =>
    cat.terms.map((term) => ({ term, categoryName: cat.name }))
  );
  // Shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return { target, tiles };
}

function formatTime(ms: number): string {
  return (ms / 1000).toFixed(1) + 's';
}

interface MatrixModeProps {
  onComplete: (timeMs: number, mistakes: number) => Promise<MatrixRoundResult>;
  onExit: () => void;
}

export const MatrixMode: React.FC<MatrixModeProps> = ({ onComplete, onExit }) => {
  const [{ target, tiles }, setRound] = useState(() => buildRound());
  const [found, setFound] = useState<Set<string>>(new Set());
  const [wrongTerm, setWrongTerm] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [phase, setPhase] = useState<'active' | 'result'>('active');
  const [result, setResult] = useState<MatrixRoundResult | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [target]);

  const remainingCount = useMemo(
    () => target.terms.filter((t) => !found.has(t)).length,
    [target, found]
  );

  const handleTileClick = async (tile: Tile) => {
    if (phase !== 'active' || found.has(tile.term)) return;

    if (tile.categoryName === target.name) {
      const nextFound = new Set(found);
      nextFound.add(tile.term);
      setFound(nextFound);

      if (nextFound.size === target.terms.length) {
        if (tickRef.current) clearInterval(tickRef.current);
        const finalTime = Date.now() - startTimeRef.current;
        setPhase('result');
        const res = await onComplete(finalTime, mistakes);
        setResult(res);
      }
    } else {
      setMistakes((m) => m + 1);
      setWrongTerm(tile.term);
      setTimeout(() => setWrongTerm(null), 400);
    }
  };

  const handleNextRound = () => {
    setRound(buildRound());
    setFound(new Set());
    setWrongTerm(null);
    setMistakes(0);
    setElapsedMs(0);
    setResult(null);
    startTimeRef.current = Date.now();
    setPhase('active');
  };

  if (phase === 'result' && result) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-5 shadow-xl animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-accent2/10 border border-accent2/40 flex items-center justify-center text-accent2">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-textPrimary">Grid Cleared!</h2>
          {result.isNewBest && (
            <p className="text-xs font-bold text-accent2 uppercase tracking-wider mt-1">
              New Personal Best!
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-8">
          <div>
            <div className="text-3xl font-bold text-textPrimary">{formatTime(result.timeMs)}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider">Time</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-danger">{result.mistakes}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider">Mistakes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">+{result.xpEarned}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider">XP</div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-border text-textSecondary hover:bg-surfaceHigh transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Arena</span>
          </button>
          <button
            onClick={handleNextRound}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-accent text-background hover:bg-accent2 hover:text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Grid</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent2">
          <Grid3x3 className="w-5 h-5" />
          <span className="text-sm font-bold text-textPrimary">{formatTime(elapsedMs)}</span>
        </div>
        <span className="text-xs font-semibold text-textMuted flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5 text-danger" /> {mistakes}
        </span>
      </div>

      <div className="bg-accent2/10 border border-accent2/40 rounded-xl p-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-accent2">Find all</p>
        <p className="text-base font-bold text-textPrimary">
          {target.name} <span className="text-textMuted font-normal text-sm">({remainingCount} left)</span>
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {tiles.map((tile) => {
          const isFound = found.has(tile.term);
          const isWrong = wrongTerm === tile.term;
          return (
            <button
              key={tile.term}
              data-term={tile.term}
              data-category={tile.categoryName}
              onClick={() => handleTileClick(tile)}
              disabled={isFound}
              className={`aspect-square rounded-xl border text-[11px] font-semibold px-1 flex items-center justify-center text-center leading-tight transition ${
                isFound
                  ? 'bg-success/20 border-success text-success cursor-default'
                  : isWrong
                  ? 'bg-danger/20 border-danger text-danger'
                  : 'bg-surfaceHigh border-border text-textPrimary hover:border-accent2/60 hover:bg-accent2/5 cursor-pointer'
              }`}
            >
              {tile.term}
            </button>
          );
        })}
      </div>
    </div>
  );
};
