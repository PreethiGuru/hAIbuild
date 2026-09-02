import React, { useState, useEffect } from 'react';
import { getDailyQuestionsForDate } from '../data/questions';
import { DailyProgress } from '../types';
import { PenguinMascot } from './PenguinMascot/PenguinMascot';
import { fetchAIElaboration, fetchAIHint, checkHasGemini } from '../ai/gemini';
import { Sparkles, CheckCircle2, ChevronDown, ChevronUp, Lightbulb, Bot, AlertCircle, BookOpen, Code2, MessageSquare, Gift } from 'lucide-react';

interface TodayTabProps {
  todayDate: string;
  dailyProgress: DailyProgress;
  onMarkDone: (key: keyof DailyProgress) => Promise<{ surpriseXp?: number } | void>;
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
  const [surpriseXp, setSurpriseXp] = useState<number | null>(null);

  useEffect(() => {
    checkHasGemini().then(setHasGemini);
  }, []);

  const handleMarkDone = async (key: keyof DailyProgress) => {
    const result = await onMarkDone(key);
    if (result?.surpriseXp) {
      setSurpriseXp(result.surpriseXp);
      setTimeout(() => setSurpriseXp(null), 3500);
    }
  };

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
    <div className="space-y-6 pb-24 text-textPrimary">
      {/* Header Row */}
      <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-border shadow-lg">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent">
            Daily Focus
          </span>
          <h1 className="text-xl font-bold text-textPrimary mt-0.5">{formattedDate}</h1>
          <p className="text-xs text-textSecondary">3 Curated Lessons Every Day</p>
        </div>
        <div className="flex items-center gap-3">
          <PenguinMascot
            state={allDone ? 'celebrating' : 'idle'}
            size="small"
          />
        </div>
      </div>

      {/* Daily Surprise Drop Toast */}
      {surpriseXp && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-accent text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 text-sm font-bold animate-fade-in">
          <Gift className="w-4 h-4" />
          Surprise! +{surpriseXp} bonus XP
        </div>
      )}

      {/* All Done Banner */}
      {allDone && (
        <div className="bg-success/10 border-2 border-success rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-md">
          <CheckCircle2 className="w-7 h-7 text-success shrink-0" />
          <div>
            <h3 className="text-base font-bold text-success">All done for today!</h3>
            <p className="text-xs text-textPrimary/80">Keep climbing 🐧 Great job maintaining your daily habit streak.</p>
          </div>
        </div>
      )}

      {/* AI Error Alert if any */}
      {aiError && (
        <div className="bg-danger/10 border border-danger/40 rounded-xl p-3 flex items-center gap-2 text-xs text-danger">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* 1. DSA Problem Card */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider">
                1. DSA Problem of the Day
              </span>
              <h2 className="text-lg font-bold text-textPrimary">{dailySet.dsa.title}</h2>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase ${
              dailySet.dsa.difficulty === 'easy'
                ? 'bg-success/20 text-success border border-success/40'
                : dailySet.dsa.difficulty === 'medium'
                ? 'bg-warning/20 text-warning border border-warning/40'
                : 'bg-danger/20 text-danger border border-danger/40'
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
              className="px-2 py-0.5 text-[11px] font-medium bg-surfaceHigh text-textSecondary rounded-md border border-border"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Story Intro */}
        <p className="text-xs italic text-textSecondary bg-surface p-3 rounded-xl border border-borderFaint">
          "{dailySet.dsa.storyIntro}"
        </p>

        {/* Problem Statement */}
        <div>
          <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-1">
            PROBLEM
          </h4>
          <p className="text-sm text-textPrimary leading-relaxed">
            {dailySet.dsa.problemStatement}
          </p>
        </div>

        {/* Constraints */}
        <div>
          <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-1">
            CONSTRAINTS
          </h4>
          <ul className="list-disc list-inside text-xs text-textSecondary space-y-1 pl-1">
            {dailySet.dsa.constraints.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>

        {/* Approaches */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold uppercase text-accent tracking-wider">
            SOLUTION APPROACHES
          </h4>
          {dailySet.dsa.approaches.map((app, idx) => (
            <div key={idx} className="bg-surfaceHigh p-3.5 rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-textPrimary">{app.name}</span>
                <div className="flex gap-2 text-[10px] text-accent">
                  <span className="bg-surface px-2 py-0.5 rounded border border-border">
                    Time: {app.timeComplexity}
                  </span>
                  <span className="bg-surface px-2 py-0.5 rounded border border-border">
                    Space: {app.spaceComplexity}
                  </span>
                </div>
              </div>
              <p className="text-xs text-textSecondary">{app.intuition}</p>

              {/* Diagram Spec Box */}
              {app.diagramSpec && (
                <div className="bg-background p-3 rounded-lg border border-borderFaint text-xs">
                  <div className="text-[10px] font-semibold text-textMuted uppercase mb-2">
                    Execution Graph
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {app.diagramSpec.nodes.map((n, i) => (
                      <React.Fragment key={n.id}>
                        <div className="px-2.5 py-1 bg-surface text-accent rounded border border-border font-mono text-[11px]">
                          {n.label}
                        </div>
                        {i < app.diagramSpec!.nodes.length - 1 && (
                          <span className="text-textMuted font-mono">→</span>
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
              className="w-full py-2 px-3 rounded-xl border border-accent/50 bg-accent/10 text-accent hover:bg-accent/20 transition text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loadingHint ? 'Generating AI Hint...' : showHintCard ? 'Hide AI Hint' : 'Get AI Hint'}
            </button>

            {showHintCard && hintText && (
              <div className="mt-3 p-3.5 bg-surface rounded-xl border border-accent/40 text-xs text-textPrimary space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-accent">
                  <Lightbulb className="w-4 h-4" />
                  <span>AI Hint</span>
                </div>
                <p className="leading-relaxed text-textSecondary">{hintText}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => handleMarkDone('dsa')}
          disabled={dailyProgress.dsa}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            dailyProgress.dsa
              ? 'bg-success/20 text-success border border-success/40 cursor-default'
              : 'bg-accent text-background hover:bg-accent2 hover:text-white shadow-md'
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
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-accent2/10 text-accent2">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-accent2 uppercase tracking-wider">
              2. ML Concept of the Day
            </span>
            <h2 className="text-lg font-bold text-textPrimary">{dailySet.mlConcept.title}</h2>
          </div>
        </div>

        {/* Intuition Summary */}
        <p className="text-xs italic text-textSecondary bg-surface p-3 rounded-xl border border-borderFaint">
          "{dailySet.mlConcept.intuitionSummary}"
        </p>

        {/* Analogy */}
        <div>
          <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-1">
            ANALOGY
          </h4>
          <p className="text-xs text-textPrimary leading-relaxed bg-surfaceHigh p-3 rounded-xl border border-border">
            {dailySet.mlConcept.analogy}
          </p>
        </div>

        {/* Deep Dive */}
        <div>
          <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-1">
            DEEP DIVE
          </h4>
          <p className="text-xs text-textSecondary leading-relaxed">
            {dailySet.mlConcept.deepDive}
          </p>
        </div>

        {/* Common Misconceptions */}
        <div>
          <h4 className="text-xs font-bold uppercase text-danger tracking-wider mb-1">
            COMMON MISCONCEPTIONS
          </h4>
          <ul className="list-disc list-inside text-xs text-textSecondary space-y-1.5 pl-1">
            {dailySet.mlConcept.commonMisconceptions.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={() => handleMarkDone('ml_concept')}
          disabled={dailyProgress.ml_concept}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            dailyProgress.ml_concept
              ? 'bg-success/20 text-success border border-success/40 cursor-default'
              : 'bg-accent text-background hover:bg-accent2 hover:text-white shadow-md'
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
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-warning uppercase tracking-wider">
                3. ML Interview Q&A
              </span>
              <h2 className="text-base font-bold text-textPrimary">{dailySet.mlQa.question}</h2>
            </div>
          </div>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase bg-warning/20 text-warning border border-warning/40">
            {dailySet.mlQa.difficulty}
          </span>
        </div>

        {/* Short Answer */}
        <div>
          <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-1">
            SHORT ANSWER
          </h4>
          <p className="text-xs text-textPrimary leading-relaxed bg-surfaceHigh p-3 rounded-xl border border-border font-medium">
            {dailySet.mlQa.shortAnswer}
          </p>
        </div>

        {/* Full Explanation */}
        <div>
          <h4 className="text-xs font-bold uppercase text-textMuted tracking-wider mb-1">
            FULL EXPLANATION
          </h4>
          <p className="text-xs text-textSecondary leading-relaxed">
            {dailySet.mlQa.fullExplanation}
          </p>
        </div>

        {/* Why It Matters */}
        <div>
          <h4 className="text-xs font-bold uppercase text-success tracking-wider mb-1">
            WHY IT MATTERS IN INTERVIEWS
          </h4>
          <p className="text-xs text-textSecondary italic">
            {dailySet.mlQa.whyItMattersInInterviews}
          </p>
        </div>

        {/* AI Elaboration Button */}
        {hasGemini && (
          <div className="pt-2">
            <button
              onClick={handleElaborate}
              disabled={loadingElaborate}
              className="w-full py-2 px-3 rounded-xl border border-accent2/50 bg-accent2/10 text-accent hover:bg-accent2/20 transition text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Bot className="w-4 h-4 text-accent" />
              {loadingElaborate ? 'Asking AI to Elaborate...' : showElaborateCard ? 'Hide AI Elaboration' : 'Ask AI to Elaborate'}
            </button>

            {showElaborateCard && elaborationText && (
              <div className="mt-3 p-3.5 bg-surface rounded-xl border border-accent2/40 text-xs text-textPrimary space-y-1 animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-accent">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>AI Simplified Elaboration</span>
                </div>
                <p className="leading-relaxed text-textSecondary">{elaborationText}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => handleMarkDone('ml_interview_qa')}
          disabled={dailyProgress.ml_interview_qa}
          className={`w-full py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
            dailyProgress.ml_interview_qa
              ? 'bg-success/20 text-success border border-success/40 cursor-default'
              : 'bg-accent text-background hover:bg-accent2 hover:text-white shadow-md'
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
