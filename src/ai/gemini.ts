import { MlInterviewQaQuestion } from '../types';

export interface DailyPulse {
  headline: string;
  briefing: string;
  topics: string[];
  date: string;
  computedAt: string;
}

export interface FluencyBreakdown {
  consistency: number;
  breadth: number;
  depth: number;
  competitive: number;
  accuracy: number;
}

export interface CoachReport {
  assessment: string;
  focusAreas: Array<{ title: string; why: string }>;
  fluency: {
    score: number;
    tier: string;
    breakdown: FluencyBreakdown;
  };
  weekIndex: number;
  computedAt: string;
}

export async function fetchCoachReport(
  uid: string,
  stats: Record<string, number>
): Promise<CoachReport | null> {
  try {
    const res = await fetch('/api/coach/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, stats }),
    });
    const data = await res.json();
    if (data.success && data.report) {
      return data.report;
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch coach report:', e);
    return null;
  }
}

export async function fetchTodayPulse(): Promise<DailyPulse | null> {
  try {
    const res = await fetch('/api/pulse/today');
    const data = await res.json();
    if (data.success && data.pulse) {
      return data.pulse;
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch daily pulse:', e);
    return null;
  }
}

export async function checkHasGemini(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    return Boolean(data.hasGemini);
  } catch (e) {
    return false;
  }
}

export async function generateAIBattleQuestion(): Promise<MlInterviewQaQuestion | null> {
  try {
    const res = await fetch('/api/gemini/battle-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const result = await res.json();
    if (result.success && result.data) {
      const q = result.data;
      return {
        id: 'ai-q-' + Date.now(),
        question: q.question || q.battleFormat?.prompt || 'AI Generated Question',
        difficulty: q.difficulty || 'mid',
        shortAnswer: q.shortAnswer || '',
        fullExplanation: q.fullExplanation || '',
        whyItMattersInInterviews: q.whyItMattersInInterviews || '',
        battleFormat: {
          prompt: q.battleFormat?.prompt || q.question || 'Select the correct statement:',
          options: q.battleFormat?.options || ['Option A', 'Option B', 'Option C', 'Option D'],
          correctOptionIndex: typeof q.battleFormat?.correctOptionIndex === 'number' ? q.battleFormat.correctOptionIndex : 0,
        },
      };
    }
    return null;
  } catch (e) {
    console.error('Failed to generate AI question:', e);
    return null;
  }
}

export async function fetchAIHint(problemStatement: string): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemStatement }),
    });
    const data = await res.json();
    if (data.success && data.hint) {
      return data.hint;
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch AI hint:', e);
    return null;
  }
}

export async function fetchAIElaboration(question: string, shortAnswer: string): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/elaborate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, shortAnswer }),
    });
    const data = await res.json();
    if (data.success && data.elaboration) {
      return data.elaboration;
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch AI elaboration:', e);
    return null;
  }
}

export async function fetchAIDailySummary(stats: {
  rating: number;
  streakCount: number;
  dsaSolvedCount: number;
  mlConceptsViewedCount: number;
  battlesPlayed: number;
  battlesWon: number;
}): Promise<string | null> {
  try {
    const res = await fetch('/api/gemini/daily-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
    const data = await res.json();
    if (data.success && data.summary) {
      return data.summary;
    }
    return null;
  } catch (e) {
    console.error('Failed to fetch AI summary:', e);
    return null;
  }
}
