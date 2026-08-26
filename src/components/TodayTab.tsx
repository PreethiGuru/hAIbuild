import React, { useState, useEffect } from 'react';
import { getDailyQuestionsForDate } from '../data/questions';
import { DailyProgress } from '../types';
import { PenguinMascot } from './PenguinMascot/PenguinMascot';
import { fetchAIElaboration, fetchAIHint, checkHasGemini } from '../ai/gemini';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, Bot, AlertCircle, BookOpen, Code2, MessageSquare } from 'lucide-react';

interface TodayTabProps {
  todayDate: string;
  dailyProgress: DailyProgress;
  onMarkDone: (key: keyof DailyProgress) => void;
}

export const TodayTab: React.FC<TodayTabProps> = ({
  todayDate,
  dailyProgress,
  onMarkDone,
}) => {
  const dailySet = getDailyQuestionsForDate(todayDate);

  const [hasGemini, setHasGemini] = useState<boolean>(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [showHintCard, setShowHintCard] = useState<boolean>(false);

  const [elaborationText, setElaborationText] = useState<string | null>(null);
  const [loadingElaborate, setLoadingElaborate] = useState<boolean>(false);
  const [showElaborateCard, setShowElaborateCard] = useState<boolean>(false);

  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    checkHasGemini().then(setHasGemini);
  }, []);

  const allDone = dailyProgress.dsa && dailyProgress.ml_concept && dailyProgress.ml_interview_qa;

  // Format date display (e.g., "Thursday, Aug 13")
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleGetHint = async () => {
    if (hintText) {
      setShowHintCard(!showHintCard);
      return;
    }
    setLoadingHint(true);
    setAiError(null);
    const hint = await fetchAIHint(dailySet.dsa.problemStatement);
    setLoadingHint(false);
    if (hint) {
      setHintText(hint);
      setShowHintCard(true);
    } else {
      setAiError('AI hint unavailable right now. Try again later!');
    }
  };

  const handleElaborate = async () => {
    if (elaborationText) {
      setShowElaborateCard(!showElaborateCard);
      return;
    }
    setLoadingElaborate(true);
    setAiError(null);
    const elab = await fetchAIElaboration(dailySet.mlQa.question, dailySet.mlQa.shortAnswer);
    setLoadingElaborate(false);
    if (elab) {
      setElaborationText(elab);
      setShowElaborateCard(true);
    } else {
      setAiError('AI elaboration unavailable right now.');
    }
  };

  return (
    <div className="space-y-6 pb-24 text-[#E8F4F8]">
      {/* Header Row */}
      <div className="flex items-center justify-between bg-[#1A1F2E] p-4 rounded-2xl border border-[#2A3F5F] shadow-lg">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#87CEEB]">
            Daily Focus
          </span>
          <h1 className="text-xl font-bold text-[#E8F4F8] mt-0.5">{formattedDate}</h1>
          <p className="text-xs text-[#A0B8D4]">3 Curated Lessons Every Day</p>
        </div>
        <div className="flex items-center gap-3">
          <PenguinMascot
            state={allDone ? 'celebrating' : 'idle'}
            size="small"
          />
        </div>
      </div>

      {/* All Done Banner */}
      {allDone && (
        <div className="bg-[#26D07C]/10 border-2 border-[#26D07C] rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-md">
          <CheckCircle2 className="w-7 h-7 text-[#26D07C] shrink-0" />
          <div>
            <h3 className="text-base font-bold text-[#26D07C]">All done for today!</h3>
            <p className="text-xs text-[#E8F4F8]/80">Keep climbing 🐧 Great job maintaining your daily habit streak.</p>
          </div>
        </div>
      )}

      {/* AI Error Alert if any */}
      {aiError && (
        <div className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/40 rounded-xl p-3 flex items-center gap-2 text-xs text-[#FF6B6B]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* 1. DSA Problem Card */}
      <div className="bg-[#1A1F2E] border border-[#2A3F5F] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#87CEEB]/10 text-[#87CEEB]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#87CEEB] uppercase tracking-wider">
                1. DSA Problem of the Day
              </span>
              <h2 className="text-lg font-bold text-[#E8F4F8]">{dailySet.dsa.title}</h2>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase ${
              dailySet.dsa.difficulty === 'easy'
                ? 'bg-[#26D07C]/20 text-[#26D07C] border border-[#26D07C]/40'
                : dailySet.dsa.difficulty === 'medium'
                ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                : 'bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/40'
            }`}
          >
            {dailySet.dsa.difficulty}
          </span>
        </div>

        {/* Topic Pills */}
        <div className="flex flex-wrap gap-1.5">
          {dailySet.dsa.topics.map((t, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-[11px] font-medium bg-[#212838] text-[#A0B8D4] rounded-md border border-[#2A3F5F]"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Story Intro */}
        <p className="text-xs italic text-[#A0B8D4] bg-[#121722] p-3 rounded-xl border border-[#1E2D45]">
          "{dailySet.dsa.storyIntro}"
        </p>

        {/* Problem Statement */}
        <div>
          <h4 className="text-xs font-bold uppercase text-[#5A7AA0] tracking-wider mb-1">
            PROBLEM
          </h4>
          <p className="text-sm text-[#E8F4F8] leading-relaxed">
            {dailySet.dsa.problemStatement}
          </p>
        </div>

        {/* Constraints */}
        <div>
          <h4 className="text-xs font-bold uppercase text-[#5A7AA0] tracking-wider mb-1">
            CONSTRAINTS
          </h4>
          <ul className="list-disc list-inside text-xs text-[#A0B8D4] space-y-1 pl-1">
            {dailySet.dsa.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        {/* Approaches */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase text-[#87CEEB] tracking-wider">
            SOLUTION APPROACHES
          </h4>
          {dailySet.dsa.approaches.map((app, idx) => (
            <div key={idx} className="bg-[#212838] p-3.5 rounded-xl border border-[#2A3F5F] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#E8F4F8]">{app.name}</span>
                <div className="flex gap-2 text-[10px] text-[#87CEEB]">
                  <span className="bg-[#1A1F2E] px-2 py-0.5 rounded border border-[#2A3F5F]">
                    Time: {app.timeComplexity}
                  </span>
                  <span className="bg-[#1A1F2E] px-2 py-0.5 rounded border border-[#2A3F5F]">
                    Space: {app.spaceComplexity}
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#A0B8D4]">{app.intuition}</p>

              {/* Diagram Spec Box */}
              {app.diagramSpec && (
                <div className="bg-[#0F1419] p-3 rounded-lg border border-[#1E2D45] text-xs">
                  <div className="text-[10px] font-semibold text-[#5A7AA0] uppercase mb-2">
                    Execution Graph
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {app.diagramSpec.nodes.map((n, i) => (
                      <React.Fragment key={n.id}>
                        <div className="px-2.5 py-1 bg-[#1A1F2E] text-[#87CEEB] rounded border border-[#2A3F5F] font-mono text-[11px]">
                          {n.label}
                        </div>
                        {i < app.diagramSpec!.nodes.length - 1 && (
                          <span className="text-[#5A7AA0] font-mono">→</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Hint Section */}
        {hasGemini && (
          <div className="pt-2">
            <button
              onClick={handleGetHint}
              disabled={loadingHint}
              className="w-full py-2 px-3 rounded-xl border border-[#87CEEB]/50 bg-[#87CEEB]/10 text-[#87CEEB] hover:bg-[#87CEEB]/20 transition text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loadingHint ? 'Generating AI Hint...' : showHintCard ? 'Hide AI Hint' : 'Get AI Hint'}
            </button>

            {showHintCard && hintText && (
              <div className="mt-3 p-3.5 bg-[#121722] rounded-xl border border-[#87CEEB]/40 text-xs text-[#E8F4F8] space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-[#87CEEB]">
                  <Lightbulb className="w-4 h-4" />
                  <span>AI Hint</span>
                </div>
                <p className="leading-relaxed text-[#A0B8D4]">{hintText}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onMarkDone('dsa')}
          disabled={dailyProgress.dsa}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            dailyProgress.dsa
              ? 'bg-[#26D07C]/20 text-[#26D07C] border border-[#26D07C]/40 cursor-default'
              : 'bg-[#87CEEB] text-[#0F1419] hover:bg-[#1E90FF] hover:text-white shadow-md'
          }`}
        >
          {dailyProgress.dsa ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Done (+10 XP)</span>
            </>
          ) : (
            'Mark as Done'
          )}
        </button>
      </div>

      {/* 2. ML Concept Card */}
      <div className="bg-[#1A1F2E] border border-[#2A3F5F] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[#1E90FF]/10 text-[#1E90FF]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#1E90FF] uppercase tracking-wider">
              2. ML Concept of the Day
            </span>
            <h2 className="text-lg font-bold text-[#E8F4F8]">{dailySet.mlConcept.title}</h2>
          </div>
        </div>

        {/* Intuition Summary */}
        <p className="text-xs italic text-[#A0B8D4] bg-[#121722] p-3 rounded-xl border border-[#1E2D45]">
          "{dailySet.mlConcept.intuitionSummary}"
        </p>

        {/* Analogy */}
        <div>
          <h4 className="text-xs font-bold uppercase text-[#5A7AA0] tracking-wider mb-1">
            ANALOGY
          </h4>
          <p className="text-xs text-[#E8F4F8] leading-relaxed bg-[#212838] p-3 rounded-xl border border-[#2A3F5F]">
            {dailySet.mlConcept.analogy}
          </p>
        </div>

        {/* Deep Dive */}
        <div>
          <h4 className="text-xs font-bold uppercase text-[#5A7AA0] tracking-wider mb-1">
            DEEP DIVE
          </h4>
          <p className="text-xs text-[#A0B8D4] leading-relaxed">
            {dailySet.mlConcept.deepDive}
          </p>
        </div>

        {/* Common Misconceptions */}
        <div>
          <h4 className="text-xs font-bold uppercase text-[#FF6B6B] tracking-wider mb-1">
            COMMON MISCONCEPTIONS
          </h4>
          <ul className="list-disc list-inside text-xs text-[#A0B8D4] space-y-1.5 pl-1">
            {dailySet.mlConcept.commonMisconceptions.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onMarkDone('ml_concept')}
          disabled={dailyProgress.ml_concept}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            dailyProgress.ml_concept
              ? 'bg-[#26D07C]/20 text-[#26D07C] border border-[#26D07C]/40 cursor-default'
              : 'bg-[#87CEEB] text-[#0F1419] hover:bg-[#1E90FF] hover:text-white shadow-md'
          }`}
        >
          {dailyProgress.ml_concept ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Done (+10 XP)</span>
            </>
          ) : (
            'Mark as Done'
          )}
        </button>
      </div>

      {/* 3. ML Interview Q&A Card */}
      <div className="bg-[#1A1F2E] border border-[#2A3F5F] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider">
                3. ML Interview Q&A
              </span>
              <h2 className="text-base font-bold text-[#E8F4F8]">{dailySet.mlQa.question}</h2>
            </div>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
            {dailySet.mlQa.difficulty}
          </span>
        </div>

        {/* Short Answer */}
        <div>
          <h4 className="text-xs font-bold uppercase text-[#5A7AA0] tracking-wider mb-1">
            SHORT ANSWER
          </h4>
          <p className="text-xs text-[#E8F4F8] leading-relaxed bg-[#212838] p-3 rounded-xl border border-[#2A3F5F] font-medium">
            {dailySet.mlQa.shortAnswer}
          </p>
        </div>

        {/* Full Explanation */}
        <div>
          <h4 className="text-xs font-bold uppercase text-[#5A7AA0] tracking-wider mb-1">
            FULL EXPLANATION
          </h4>
          <p className="text-xs text-[#A0B8D4] leading-relaxed">
            {dailySet.mlQa.fullExplanation}
          </p>
        </div>

        {/* Why It Matters */}
        <div>
          <h4 className="text-xs font-bold uppercase text-[#26D07C] tracking-wider mb-1">
            WHY IT MATTERS IN INTERVIEWS
          </h4>
          <p className="text-xs text-[#A0B8D4] italic">
            {dailySet.mlQa.whyItMattersInInterviews}
          </p>
        </div>

        {/* AI Elaboration Button */}
        {hasGemini && (
          <div className="pt-2">
            <button
              onClick={handleElaborate}
              disabled={loadingElaborate}
              className="w-full py-2 px-3 rounded-xl border border-[#1E90FF]/50 bg-[#1E90FF]/10 text-[#87CEEB] hover:bg-[#1E90FF]/20 transition text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-[#87CEEB]" />
              {loadingElaborate ? 'Asking AI to Elaborate...' : showElaborateCard ? 'Hide AI Elaboration' : 'Ask AI to Elaborate'}
            </button>

            {showElaborateCard && elaborationText && (
              <div className="mt-3 p-3.5 bg-[#121722] rounded-xl border border-[#1E90FF]/40 text-xs text-[#E8F4F8] space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-[#87CEEB]">
                  <Sparkles className="w-4 h-4 text-[#87CEEB]" />
                  <span>AI Simplified Elaboration</span>
                </div>
                <p className="leading-relaxed text-[#A0B8D4]">{elaborationText}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => onMarkDone('ml_interview_qa')}
          disabled={dailyProgress.ml_interview_qa}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            dailyProgress.ml_interview_qa
              ? 'bg-[#26D07C]/20 text-[#26D07C] border border-[#26D07C]/40 cursor-default'
              : 'bg-[#87CEEB] text-[#0F1419] hover:bg-[#1E90FF] hover:text-white shadow-md'
          }`}
        >
          {dailyProgress.ml_interview_qa ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>✓ Done (+10 XP)</span>
            </>
          ) : (
            'Mark as Done'
          )}
        </button>
      </div>
    </div>
  );
};
