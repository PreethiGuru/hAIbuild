import React, { useState } from 'react';
import { DEBUG_CODE_CHALLENGES, DebugCodeChallenge } from '../data/debugCodeChallenges';
import { DebugChallengeResult } from '../types';
import { Bug, ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

function pickRandomChallenge(excludeId?: string): DebugCodeChallenge {
  const pool = excludeId
    ? DEBUG_CODE_CHALLENGES.filter((c) => c.id !== excludeId)
    : DEBUG_CODE_CHALLENGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

interface DebugCodeModeProps {
  onComplete: (correct: boolean) => Promise<DebugChallengeResult>;
  onExit: () => void;
}

export const DebugCodeMode: React.FC<DebugCodeModeProps> = ({ onComplete, onExit }) => {
  const [challenge, setChallenge] = useState<DebugCodeChallenge>(() => pickRandomChallenge());
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<DebugChallengeResult | null>(null);
  const [sessionSolved, setSessionSolved] = useState<number>(0);
  const [sessionAttempted, setSessionAttempted] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSelectLine = async (idx: number) => {
    if (revealed || submitting) return;
    setSubmitting(true);
    setSelectedLine(idx);
    const correct = idx === challenge.buggyLineIndex;
    const res = await onComplete(correct);
    setLastResult(res);
    setSessionAttempted((n) => n + 1);
    setSessionSolved((n) => n + (correct ? 1 : 0));
    setRevealed(true);
    setSubmitting(false);
  };

  const handleNext = () => {
    setChallenge(pickRandomChallenge(challenge.id));
    setSelectedLine(null);
    setRevealed(false);
    setLastResult(null);
  };

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-danger">
          <Bug className="w-5 h-5" />
          <span className="text-sm font-bold text-textPrimary">{challenge.title}</span>
        </div>
        <span className="text-xs font-semibold text-textMuted">
          {sessionSolved} / {sessionAttempted} solved
        </span>
      </div>

      <p className="text-xs text-textSecondary">
        {revealed ? 'Here\'s what went wrong:' : 'Click the line with the bug.'}
      </p>

      <div className="bg-[#1E1E1E] rounded-xl overflow-x-auto border border-border">
        {challenge.lines.map((line, idx) => {
          const isBuggy = idx === challenge.buggyLineIndex;
          const isSelected = idx === selectedLine;

          let rowClass = 'hover:bg-white/5';
          if (revealed) {
            if (isBuggy) rowClass = 'bg-success/20';
            else if (isSelected) rowClass = 'bg-danger/20';
          } else if (isSelected) {
            rowClass = 'bg-accent/20';
          }

          return (
            <button
              key={idx}
              data-line-index={idx}
              onClick={() => handleSelectLine(idx)}
              disabled={revealed || submitting}
              className={`min-w-full text-left flex items-start gap-3 px-3 py-1.5 font-mono text-[12px] transition ${rowClass} ${
                revealed ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <span className="text-white/30 select-none w-4 text-right shrink-0">{idx + 1}</span>
              <span className="text-[#D4D4D4] whitespace-pre shrink-0">{line || ' '}</span>
              {revealed && isBuggy && <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 ml-auto" />}
              {revealed && isSelected && !isBuggy && <XCircle className="w-3.5 h-3.5 text-danger shrink-0 ml-auto" />}
            </button>
          );
        })}
      </div>

      {revealed && lastResult && (
        <div
          className={`p-4 rounded-xl border space-y-2 text-xs ${
            lastResult.correct ? 'bg-success/10 border-success/40' : 'bg-danger/10 border-danger/40'
          }`}
        >
          <div className={`font-bold flex items-center gap-1.5 ${lastResult.correct ? 'text-success' : 'text-danger'}`}>
            {lastResult.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>
              {lastResult.correct ? `Correct! +${lastResult.xpEarned} XP` : 'Not quite -- no XP this time'}
            </span>
          </div>
          <p className="text-textSecondary leading-relaxed">{challenge.explanation}</p>
          <div className="bg-background/60 rounded-lg p-2 font-mono text-[11px] text-success whitespace-pre-wrap overflow-x-auto">
            {challenge.fix}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onExit}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm border-2 border-border text-textSecondary hover:bg-surfaceHigh transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Arena</span>
        </button>
        {revealed && (
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-accent text-background hover:bg-accent2 hover:text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Snippet</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
