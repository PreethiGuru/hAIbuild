export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type InterviewDifficulty = 'junior' | 'mid' | 'senior';

export interface DiagramNode {
  id: string;
  label: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramSpec {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface Approach {
  name: string;
  intuition: string;
  timeComplexity: string;
  spaceComplexity: string;
  diagramSpec?: DiagramSpec;
}

export interface DsaQuestion {
  id: string;
  title: string;
  difficulty: DifficultyLevel;
  topics: string[];
  storyIntro: string;
  problemStatement: string;
  constraints: string[];
  approaches: Approach[];
}

export interface MlConceptQuestion {
  id: string;
  title: string;
  intuitionSummary: string;
  analogy: string;
  deepDive: string;
  commonMisconceptions: string[];
}

export interface BattleFormat {
  prompt: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
}

export interface MlInterviewQaQuestion {
  id: string;
  question: string;
  difficulty: InterviewDifficulty;
  shortAnswer: string;
  fullExplanation: string;
  whyItMattersInInterviews: string;
  battleFormat: BattleFormat;
}

export interface LocalProfile {
  rating: number; // default 1200
  streakCount: number;
  longestStreak: number;
  lastActivityDate: string | null; // "YYYY-MM-DD"
  xp: number;
  level: number;
  stats: {
    battlesPlayed: number;
    battlesWon: number;
    battlesLost: number;
    dsaSolvedCount: number;
    mlConceptsViewedCount: number;
    mlQaViewedCount: number;
  };
}

export interface DailyProgress {
  dsa: boolean;
  ml_concept: boolean;
  ml_interview_qa: boolean;
}

export interface BattleResult {
  won: boolean;
  oldRating: number;
  newRating: number;
  ratingDelta: number;
  xpEarned: number;
}

export type MascotAnimationState = 'idle' | 'walking' | 'celebrating' | 'climbing';
export type MascotSize = 'small' | 'medium' | 'large';
