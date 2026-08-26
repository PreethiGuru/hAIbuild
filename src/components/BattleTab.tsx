import React, { useState, useEffect, useRef } from 'react';
import { BattleResult, InterviewDifficulty, MlInterviewQaQuestion } from '../types';
import { getRandomBattleQuestion } from '../data/questions';
import { checkHasGemini, generateAIBattleQuestion } from '../ai/gemini';
import { Swords, Timer, Sparkles, CheckCircle2, XCircle, ArrowRight, Shield, Award, AlertCircle, RefreshCw } from 'lucide-react';

interface BattleTabProps {
  currentRating: number;
  onRecordResult: (won: boolean, difficulty?: InterviewDifficulty) => Promise<BattleResult>;
}

type BattlePhase = 'idle' | 'active' | 'result';

export const BattleTab: React.FC<BattleTabProps> = ({ currentRating, onRecordResult }) => {
  const [phase, setPhase] = useState<BattlePhase>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<MlInterviewQaQuestion>(getRandomBattleQuestion);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [hasGemini, setHasGemini] = useState<boolean>(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkHasGemini().then(setHasGemini);
  }, []);

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

  const handleStartBattle = (questionToUse?: MlInterviewQaQuestion) => {
    const q = questionToUse || getRandomBattleQuestion();
    setCurrentQuestion(q);
    setSelectedOption(null);
    setBattleResult(null);
    setPhase('active');
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
    <div className="space-y-6 pb-24 text-[#E8F4F8]">
      {/* Header Banner */}
      <div className="flex items-center justify-between bg-[#1A1F2E] p-4 rounded-2xl border border-[#2A3F5F] shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#87CEEB]/10 text-[#87CEEB]">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#87CEEB]">
              Solo Arena
            </span>
            <h1 className="text-xl font-bold text-[#E8F4F8]">Practice Battle</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#212838] px-3 py-1.5 rounded-xl border border-[#2A3F5F]">
          <Shield className="w-4 h-4 text-[#F59E0B]" />
          <div className="text-right">
            <div className="text-[10px] text-[#5A7AA0] font-semibold">CURRENT ELO</div>
            <div className="text-xs font-bold text-[#E8F4F8]">{currentRating}</div>
          </div>
        </div>
      </div>

      {/* PHASE 1: IDLE */}
      {phase === 'idle' && (
        <div className="bg-[#1A1F2E] border border-[#2A3F5F] rounded-2xl p-6 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#87CEEB]/10 border border-[#87CEEB]/40 flex items-center justify-center text-[#87CEEB]">
            <Swords className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-sm mx-auto">
            <h2 className="text-lg font-bold text-[#E8F4F8]">Test Your AIML Knowledge</h2>
            <p className="text-xs text-[#A0B8D4] leading-relaxed">
              Answer 1 multiple-choice AIML question under a 60-second timer. Win battles to increase your competitive ELO rating and climb the leaderboards!
            </p>
          </div>

          {aiError && (
            <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/40 rounded-xl p-3 text-xs text-[#FF6B6B] flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{aiError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2 max-w-xs mx-auto">
            <button
              onClick={() => handleStartBattle()}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-[#87CEEB] text-[#0F1419] hover:bg-[#1E90FF] hover:text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Start Practice (60s)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {hasGemini && (
              <button
                onClick={handleGenerateAiQuestion}
                disabled={isAiLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm border-2 border-[#87CEEB] text-[#87CEEB] hover:bg-[#87CEEB]/10 transition flex items-center justify-center gap-2 cursor-pointer"
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
          </div>
        </div>
      )}

      {/* PHASE 2: ACTIVE (60s COUNTDOWN) */}
      {phase === 'active' && (
        <div className="bg-[#1A1F2E] border border-[#2A3F5F] rounded-2xl p-5 space-y-5 shadow-xl animate-fade-in">
          {/* Timer & Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-[#FF6B6B] animate-pulse' : 'text-[#87CEEB]'}`} />
                <span className={`text-sm font-bold ${timeLeft <= 10 ? 'text-[#FF6B6B]' : 'text-[#E8F4F8]'}`}>
                  {timeLeft}s remaining
                </span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase bg-[#212838] border border-[#2A3F5F] text-[#A0B8D4]">
                {currentQuestion.difficulty}
              </span>
            </div>

            {/* Shrinking progress bar */}
            <div className="w-full h-2 bg-[#0F1419] rounded-full overflow-hidden border border-[#2A3F5F]">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  timeLeft <= 10 ? 'bg-[#FF6B6B]' : 'bg-[#87CEEB]'
                }`}
                style={{ width: `${(timeLeft / 60) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div className="bg-[#212838] p-4 rounded-xl border border-[#2A3F5F]">
            <h3 className="text-base font-bold text-[#E8F4F8] leading-snug">
              {currentQuestion.battleFormat.prompt}
            </h3>
          </div>

          {/* 4 Option Buttons */}
          <div className="space-y-3">
            {currentQuestion.battleFormat.options.map((optionText, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className="w-full p-4 rounded-xl border border-[#2A3F5F] bg-[#161C26] hover:bg-[#212838] hover:border-[#87CEEB]/50 transition text-left text-sm text-[#E8F4F8] flex items-start gap-3 cursor-pointer group"
              >
                <span className="w-6 h-6 rounded-lg bg-[#212838] border border-[#2A3F5F] text-[#87CEEB] text-xs font-bold flex items-center justify-center shrink-0 group-hover:border-[#87CEEB]">
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
        <div className="bg-[#1A1F2E] border border-[#2A3F5F] rounded-2xl p-6 space-y-6 shadow-xl animate-fade-in">
          {/* Status Header */}
          <div className="text-center space-y-2">
            {battleResult.won ? (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#26D07C]/20 border border-[#26D07C] text-[#26D07C]">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#FF6B6B]/20 border border-[#FF6B6B] text-[#FF6B6B]">
                <XCircle className="w-7 h-7" />
              </div>
            )}

            <h2
              className={`text-2xl font-bold ${
                battleResult.won
                  ? 'text-[#26D07C]'
                  : selectedOption === -1
                  ? 'text-[#F59E0B]'
                  : 'text-[#FF6B6B]'
              }`}
            >
              {battleResult.won ? 'Correct!' : selectedOption === -1 ? "Time's Up!" : 'Incorrect'}
            </h2>

            {/* ELO Delta Row */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#212838] border border-[#2A3F5F]">
              <Award className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs text-[#A0B8D4]">
                ELO: <strong className="text-[#E8F4F8]">{battleResult.oldRating}</strong> →{' '}
                <strong className="text-[#E8F4F8]">{battleResult.newRating}</strong>
              </span>
              <span
                className={`text-xs font-bold ${
                  battleResult.ratingDelta >= 0 ? 'text-[#26D07C]' : 'text-[#FF6B6B]'
                }`}
              >
                ({battleResult.ratingDelta >= 0 ? `+${battleResult.ratingDelta}` : battleResult.ratingDelta})
              </span>
            </div>
          </div>

          {/* Options Recap */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase text-[#5A7AA0] tracking-wider">
              ANSWER RECAP
            </h4>

            {currentQuestion.battleFormat.options.map((optionText, idx) => {
              const isCorrectOpt = idx === currentQuestion.battleFormat.correctOptionIndex;
              const isUserOpt = idx === selectedOption;

              let styleClass = 'border-[#2A3F5F] bg-[#161C26] text-[#A0B8D4]';
              if (isCorrectOpt) {
                styleClass = 'border-[#26D07C] bg-[#26D07C]/10 text-[#E8F4F8] font-semibold';
              } else if (isUserOpt && !isCorrectOpt) {
                styleClass = 'border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#E8F4F8]';
              }

              return (
                <div key={idx} className={`p-3.5 rounded-xl border ${styleClass} text-xs flex items-center justify-between gap-3`}>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-[#5A7AA0]">{String.fromCharCode(65 + idx)}.</span>
                    <span>{optionText}</span>
                  </div>
                  {isCorrectOpt && (
                    <span className="px-2 py-0.5 rounded bg-[#26D07C]/20 text-[#26D07C] font-bold text-[10px] shrink-0">
                      ✓ Correct Answer
                    </span>
                  )}
                  {isUserOpt && !isCorrectOpt && (
                    <span className="px-2 py-0.5 rounded bg-[#FF6B6B]/20 text-[#FF6B6B] font-bold text-[10px] shrink-0">
                      ✕ Your Choice
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Short Answer & Full Explanation */}
          <div className="bg-[#212838] p-4 rounded-xl border border-[#2A3F5F] space-y-3 text-xs">
            <div>
              <span className="font-bold text-[#87CEEB] block mb-1">KEY TAKEAWAY:</span>
              <p className="text-[#E8F4F8] leading-relaxed">{currentQuestion.shortAnswer}</p>
            </div>
            <div>
              <span className="font-bold text-[#5A7AA0] block mb-1">EXPLANATION:</span>
              <p className="text-[#A0B8D4] leading-relaxed">{currentQuestion.fullExplanation}</p>
            </div>
          </div>

          {/* Next Question Button */}
          <button
            onClick={() => handleStartBattle()}
            className="w-full py-3 rounded-xl font-bold text-sm bg-[#87CEEB] text-[#0F1419] hover:bg-[#1E90FF] hover:text-white transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Next Question</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
