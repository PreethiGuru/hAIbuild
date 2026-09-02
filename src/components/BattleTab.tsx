import React, { useState, useEffect, useRef } from 'react';
import { BattleResult, InterviewDifficulty, MlInterviewQaQuestion, SpeedRoundResult } from '../types';
import { getBattleQuestionById, getRandomBattleQuestion, getRandomBattleQuestionByDifficulty } from '../data/questions';
import { checkHasGemini, generateAIBattleQuestion } from '../ai/gemini';
import { Swords, Timer, Sparkles, CheckCircle2, XCircle, ArrowRight, Shield, Award, AlertCircle, RefreshCw, Link2, Check, Crown, Zap } from 'lucide-react';
import { SpeedRoundMode } from './SpeedRoundMode';

const BOSS_FIGHT_STREAK_THRESHOLD = 3;

interface BattleTabProps {
  currentRating: number;
  streakCount: number;
  onRecordResult: (won: boolean, difficulty?: InterviewDifficulty) => Promise<BattleResult>;
  onRecordSpeedRoundResult: (correctCount: number, totalAnswered: number) => Promise<SpeedRoundResult>;
}

type BattlePhase = 'idle' | 'active' | 'result';
type BattleMode = 'solo' | 'speed';

export const BattleTab: React.FC<BattleTabProps> = ({
  currentRating,
  streakCount,
  onRecordResult,
  onRecordSpeedRoundResult,
}) => {
  const [mode, setMode] = useState<BattleMode>('solo');
  const [phase, setPhase] = useState<BattlePhase>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<MlInterviewQaQuestion>(getRandomBattleQuestion);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [hasGemini, setHasGemini] = useState<boolean>(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [isChallengeFromFriend, setIsChallengeFromFriend] = useState<boolean>(false);
  const [isBossFight, setIsBossFight] = useState<boolean>(false);
  const bossFightUnlocked = streakCount >= BOSS_FIGHT_STREAK_THRESHOLD;

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkHasGemini().then(setHasGemini);
  }, []);

  useEffect(() => {
    const challengeId = new URLSearchParams(window.location.search).get('challenge');
    if (!challengeId) return;
    const challengeQuestion = getBattleQuestionById(challengeId);
    if (challengeQuestion) {
      setIsChallengeFromFriend(true);
      handleStartBattle(challengeQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShareChallenge = async () => {
    const url = `${window.location.origin}${window.location.pathname}?challenge=${currentQuestion.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy challenge link:', e);
    }
  };

  // Timer countdown logic for Phase 2
  useEffect(() => {
    if (phase === 'active') {
      setTimeLeft(60);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const handleStartBattle = (questionToUse?: MlInterviewQaQuestion, bossFight = false) => {
    const q = questionToUse || getRandomBattleQuestion();
    setCurrentQuestion(q);
    setSelectedOption(null);
    setBattleResult(null);
    setIsBossFight(bossFight);
    setPhase('active');
  };

  const handleStartBossFight = () => {
    handleStartBattle(getRandomBattleQuestionByDifficulty('senior'), true);
  };

  const handleGenerateAiQuestion = async () => {
    setIsAiLoading(true);
    setAiError(null);
    const aiQ = await generateAIBattleQuestion();
    setIsAiLoading(false);
    if (aiQ) {
      handleStartBattle(aiQ);
    } else {
      setAiError('Failed to generate AI question. Starting standard battle instead.');
      handleStartBattle();
    }
  };

  const handleOptionSelect = async (optionIdx: number) => {
    if (phase !== 'active' || selectedOption !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);

    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === currentQuestion.battleFormat.correctOptionIndex;
    const res = await onRecordResult(isCorrect, currentQuestion.difficulty);
    setBattleResult(res);
    setPhase('result');
  };

  const handleTimeOut = async () => {
    if (selectedOption !== null) return;
    setSelectedOption(-1); // timeout marker
    const res = await onRecordResult(false, currentQuestion.difficulty);
    setBattleResult(res);
    setPhase('result');
  };

  return (
    <div className="space-y-6 pb-24 text-textPrimary">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Solo Arena
            </span>
            <h1 className="text-xl font-bold text-textPrimary">Practice Battle</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-surfaceHigh px-3 py-1.5 rounded-xl border border-border">
          <Shield className="w-4 h-4 text-warning" />
          <div className="text-right">
            <div className="text-[10px] text-textMuted font-semibold">CURRENT ELO</div>
            <div className="text-xs font-bold text-textPrimary">{currentRating}</div>
          </div>
        </div>
      </div>

      {mode === 'speed' ? (
        <SpeedRoundMode
          onComplete={onRecordSpeedRoundResult}
          onExit={() => setMode('solo')}
        />
      ) : (
        <>
      {isChallengeFromFriend && phase !== 'result' && (
        <div className="bg-accent/10 border border-accent/40 rounded-xl p-3 flex items-center gap-2 text-xs text-accent font-semibold">
          <Link2 className="w-4 h-4 shrink-0" />
          <span>You're taking on a friend's challenge question!</span>
        </div>
      )}

      {isBossFight && phase !== 'idle' && (
        <div className="bg-warning/10 border border-warning/40 rounded-xl p-3 flex items-center gap-2 text-xs text-warning font-bold uppercase tracking-wider">
          <Crown className="w-4 h-4 shrink-0" />
          <span>Boss Fight</span>
        </div>
      )}

      {/* PHASE 1: IDLE */}
      {phase === 'idle' && (
        <div className="bg-surface border border-border rounded-2xl p-6 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center text-accent">
            <Swords className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-sm mx-auto">
            <h2 className="text-lg font-bold text-textPrimary">Test Your AIML Knowledge</h2>
            <p className="text-xs text-textSecondary leading-relaxed">
              Answer 1 multiple-choice AIML question under a 60-second timer. Win battles to increase your competitive ELO rating and climb the leaderboards!
            </p>
          </div>

          {aiError && (
            <div className="bg-danger/10 border border-danger/40 rounded-xl p-3 text-xs text-danger flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{aiError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2 max-w-xs mx-auto">
            <button
              onClick={() => handleStartBattle()}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-accent text-background hover:bg-accent2 hover:text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Practice (60s)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {hasGemini && (
              <button
                onClick={handleGenerateAiQuestion}
                disabled={isAiLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm border-2 border-accent text-accent hover:bg-accent/10 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating AI Question...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Question</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setMode('speed')}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm border-2 border-accent2 text-accent2 hover:bg-accent2/10 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Speed Round (60s True/False)</span>
            </button>

            <button
              onClick={handleStartBossFight}
              disabled={!bossFightUnlocked}
              title={
                bossFightUnlocked
                  ? undefined
                  : `Reach a ${BOSS_FIGHT_STREAK_THRESHOLD}-day streak to unlock`
              }
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${
                bossFightUnlocked
                  ? 'border-2 border-warning text-warning hover:bg-warning/10 cursor-pointer'
                  : 'border-2 border-border text-textMuted cursor-not-allowed opacity-60'
              }`}
            >
              <Crown className="w-4 h-4" />
              <span>
                {bossFightUnlocked
                  ? 'Boss Fight (Senior Question)'
                  : `Boss Fight -- ${BOSS_FIGHT_STREAK_THRESHOLD}-day streak to unlock`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: ACTIVE (60s COUNTDOWN) */}
      {phase === 'active' && (
        <div className="bg-surface border border-border rounded-2xl p-5 space-y-5 shadow-xl animate-fade-in">
          {/* Timer & Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-danger animate-pulse' : 'text-accent'}`} />
                <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-danger' : 'text-textPrimary'}`}>
                  {timeLeft}s remaining
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-surfaceHigh border border-border text-textSecondary">
                {currentQuestion.difficulty}
              </span>
            </div>

            {/* Shrinking progress bar */}
            <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-border">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 10 ? 'bg-danger' : 'bg-accent'
                }`}
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="bg-surfaceHigh p-4 rounded-xl border border-border">
            <h3 className="text-base font-bold text-textPrimary leading-snug">
              {currentQuestion.battleFormat.prompt}
            </h3>
          </div>

          {/* 4 Option Buttons */}
          <div className="space-y-3">
            {currentQuestion.battleFormat.options.map((optionText, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className="w-full p-4 rounded-xl border border-border bg-surface hover:bg-surfaceHigh hover:border-accent/50 transition text-left text-sm text-textPrimary flex items-start gap-3 cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-lg bg-surfaceHigh border border-border text-accent text-xs font-bold flex items-center justify-center shrink-0 group-hover:border-accent">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug pt-0.5">{optionText}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PHASE 3: RESULT */}
      {phase === 'result' && battleResult && (
        <div className="bg-surface border border-border rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
          {/* Status Header */}
          <div className="text-center space-y-2">
            {battleResult.won ? (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/20 border border-success text-success">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-danger/20 border border-danger text-danger">
                <XCircle className="w-7 h-7" />
              </div>
            )}

            <h2
              className={`text-2xl font-bold ${
                battleResult.won
                  ? 'text-success'
                  : selectedOption === -1
                  ? 'text-warning'
                  : 'text-danger'
              }`}
            >
              {battleResult.won ? 'Correct!' : selectedOption === -1 ? "Time's Up!" : 'Incorrect'}
            </h2>

            {/* ELO Delta Row */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surfaceHigh border border-border">
              <Award className="w-4 h-4 text-warning" />
              <span className="text-xs text-textSecondary">
                ELO: <strong className="text-textPrimary">{battleResult.oldRating}</strong> →{' '}
                <strong className="text-textPrimary">{battleResult.newRating}</strong>
              </span>
              <span
                className={`text-xs font-bold ${
                  battleResult.ratingDelta >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                ({battleResult.ratingDelta >= 0 ? `+${battleResult.ratingDelta}` : battleResult.ratingDelta})
              </span>
            </div>
          </div>

          {/* Options Recap */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider">
              ANSWER RECAP
            </h4>

            {currentQuestion.battleFormat.options.map((optionText, idx) => {
              const isCorrectOpt = idx === currentQuestion.battleFormat.correctOptionIndex;
              const isUserOpt = idx === selectedOption;

              let styleClass = 'border-border bg-surface text-textSecondary';
              if (isCorrectOpt) {
                styleClass = 'border-success bg-success/10 text-textPrimary font-semibold';
              } else if (isUserOpt && !isCorrectOpt) {
                styleClass = 'border-danger bg-danger/10 text-textPrimary';
              }

              return (
                <div key={idx} className={`p-3.5 rounded-xl border ${styleClass} text-xs flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-textMuted">{String.fromCharCode(65 + idx)}.</span>
                    <span>{optionText}</span>
                  </div>
                  {isCorrectOpt && (
                    <span className="px-2 py-0.5 rounded bg-success/20 text-success font-bold text-[10px] shrink-0">
                      ✓ Correct Answer
                    </span>
                  )}
                  {isUserOpt && !isCorrectOpt && (
                    <span className="px-2 py-0.5 rounded bg-danger/20 text-danger font-bold text-[10px] shrink-0">
                      ✕ Your Choice
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Short Answer & Full Explanation */}
          <div className="bg-surfaceHigh p-4 rounded-xl border border-border space-y-3 text-xs">
            <div>
              <span className="font-bold text-accent block mb-1">KEY TAKEAWAY:</span>
              <p className="text-textPrimary leading-relaxed">{currentQuestion.shortAnswer}</p>
            </div>
            <div>
              <span className="font-bold text-textMuted block mb-1">EXPLANATION:</span>
              <p className="text-textSecondary leading-relaxed">{currentQuestion.fullExplanation}</p>
            </div>
          </div>

          {/* Challenge a Friend */}
          <button
            onClick={handleShareChallenge}
            className="w-full py-2.5 rounded-xl font-bold text-sm border-2 border-accent2 text-accent2 hover:bg-accent2/10 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {linkCopied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                <span>Challenge a Friend to This Question</span>
              </>
            )}
          </button>

          {/* Next Question Button */}
          <button
            onClick={() => handleStartBattle()}
            className="w-full py-3 rounded-xl font-bold text-sm bg-accent text-background hover:bg-accent2 hover:text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
};
