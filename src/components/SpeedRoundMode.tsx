import React, { useEffect, useRef, useState } from 'react';
import { SPEED_ROUND_STATEMENTS, SpeedRoundStatement } from '../data/speedRoundStatements';
import { SpeedRoundResult } from '../types';
import { Zap, Check, X, ArrowLeft, Trophy } from 'lucide-react';

const ROUND_SECONDS = 60;
const FEEDBACK_DELAY_MS = 550;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface SpeedRoundModeProps {
  onComplete: (correctCount: number, totalAnswered: number) => Promise<SpeedRoundResult>;
  onExit: () => void;
}

export const SpeedRoundMode: React.FC<SpeedRoundModeProps> = ({ onComplete, onExit }) => {
  const [phase, setPhase] = useState<'active' | 'submitting' | 'result'>('active');
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_SECONDS);
  const [queue, setQueue] = useState<SpeedRoundStatement[]>(() => shuffle(SPEED_ROUND_STATEMENTS));
  const [queueIndex, setQueueIndex] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState<number>(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [result, setResult] = useState<SpeedRoundResult | null>(null);
  const [locked, setLocked] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const finishedRef = useRef<boolean>(false);

  const current = queue[queueIndex % queue.length];

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !finishedRef.current) {
      finishedRef.current = true;
      finishRound();
    }
    // finishRound reads correctCount/totalAnswered from the latest render's
    // closure -- both are already committed by the time this effect fires,
    // since setCorrectCount/setTotalAnswered run synchronously in
    // handleAnswer, well before this effect's own state (timeLeft) settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const finishRound = async () => {
    setPhase('submitting');
    const res = await onComplete(correctCount, totalAnswered);
    setResult(res);
    setPhase('result');
  };

  const handleAnswer = (answer: boolean) => {
    if (locked || phase !== 'active') return;
    setLocked(true);

    const isCorrect = answer === current.isTrue;
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextTotal = totalAnswered + 1;
    setCorrectCount(nextCorrect);
    setTotalAnswered(nextTotal);
    setFeedback(isCorrect ? 'correct' : 'incorrect');

    setTimeout(() => {
      setFeedback(null);
      setLocked(false);
      setQueueIndex((i) => {
        const next = i + 1;
        if (next >= queue.length) {
          setQueue(shuffle(SPEED_ROUND_STATEMENTS));
          return 0;
        }
        return next;
      });
    }, FEEDBACK_DELAY_MS);
  };

  if (phase === 'result' && result) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-5 shadow-xl animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-warning/10 border border-warning/40 flex items-center justify-center text-warning">
          <Trophy className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-textPrimary">Speed Round Complete!</h2>
          {result.isNewBest && (
            <p className="text-xs font-bold text-warning uppercase tracking-wider mt-1">
              New Personal Best!
            </p>
          )}
        </div>
        <div className="flex items-center justify-center gap-8">
          <div>
            <div className="text-3xl font-bold text-success">{result.correctCount}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider">Correct</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-textPrimary">{result.totalAnswered}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider">Answered</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">+{result.xpEarned}</div>
            <div className="text-[10px] text-textMuted uppercase tracking-wider">XP</div>
          </div>
        </div>
        <button
          onClick={onExit}
          className="w-full py-3 rounded-xl font-bold text-sm bg-accent text-background hover:bg-accent2 hover:text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Arena</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-5 shadow-xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent2">
          <Zap className="w-5 h-5" />
          <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-danger animate-pulse' : 'text-textPrimary'}`}>
            {phase === 'submitting' ? "Time's up!" : `${timeLeft}s`}
          </span>
        </div>
        <span className="text-xs font-semibold text-textMuted">
          {correctCount} correct · {totalAnswered} answered
        </span>
      </div>

      <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeLeft <= 10 ? 'bg-danger' : 'bg-accent2'
          }`}
          style={{ width: `${(timeLeft / ROUND_SECONDS) * 100}%` }}
        />
      </div>

      <div
        className={`p-5 rounded-xl border text-center transition-colors ${
          feedback === 'correct'
            ? 'bg-success/10 border-success'
            : feedback === 'incorrect'
            ? 'bg-danger/10 border-danger'
            : 'bg-surfaceHigh border-border'
        }`}
      >
        <p className="text-base font-bold text-textPrimary leading-snug">{current.statement}</p>
        {feedback && (
          <p className="text-xs text-textSecondary mt-2 leading-relaxed">{current.explanation}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleAnswer(true)}
          disabled={locked || phase !== 'active'}
          className="py-4 rounded-xl font-bold text-sm bg-success/10 border-2 border-success text-success hover:bg-success/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          <span>True</span>
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={locked || phase !== 'active'}
          className="py-4 rounded-xl font-bold text-sm bg-danger/10 border-2 border-danger text-danger hover:bg-danger/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <X className="w-5 h-5" />
          <span>False</span>
        </button>
      </div>
    </div>
  );
};
