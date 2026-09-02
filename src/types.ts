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
  freezeAvailable: boolean;
  nextFreezeAt: string | null; // "YYYY-MM-DD" -- when a used freeze becomes available again
  guildCode: string | null;
  stats: {
    battlesPlayed: number;
    battlesWon: number;
    battlesLost: number;
    dsaSolvedCount: number;
    mlConceptsViewedCount: number;
    mlQaViewedCount: number;
    speedRoundsPlayed: number;
    speedRoundBestScore: number;
    debugChallengesAttempted: number;
    debugChallengesSolved: number;
    matrixRoundsCompleted: number;
    matrixBestTimeMs: number;
  };
}

export interface SpeedRoundResult {
  correctCount: number;
  totalAnswered: number;
  xpEarned: number;
  isNewBest: boolean;
}

export interface GuildMember {
  uid: string;
  streakCount: number;
  rating: number;
}

export interface GuildData {
  code: string;
  name: string;
  streakGoal: number;
  members: GuildMember[];
}

export interface JoinGuildResult {
  success: boolean;
  error?: string;
}

export interface DebugChallengeResult {
  correct: boolean;
  xpEarned: number;
}

export interface MatrixRoundResult {
  timeMs: number;
  mistakes: number;
  xpEarned: number;
  isNewBest: boolean;
}

export interface DuelPlayerResult {
  won: boolean;
  timeMs: number;
}

export interface DuelData {
  id: string;
  questionId: string;
  creatorUid: string;
  creatorResult: DuelPlayerResult | null;
  opponentUid: string | null;
  opponentResult: DuelPlayerResult | null;
}

export interface LeaderboardEntry {
  uid: string;
  rating: number;
  streakCount: number;
  level: number;
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
