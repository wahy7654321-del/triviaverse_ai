export type HostId = 'arya' | 'kiki' | 'roro' | 'bintang' | 'cyber';

export interface HostProfile {
  id: HostId;
  name: string;
  title: string;
  voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  badge: string;
  themeColor: {
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    bgGlow: string;
    gradient: string;
  };
  avatarEmoji: string;
  catchphrase: string;
  bio: string;
  styleDescription: string;
  defaultSpice: number; // 1-4
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  interestingFact: string;
  hostQuip: string;
}

export type GameStage = 'setup' | 'playing' | 'round-result' | 'game-over';

export interface Lifelines {
  fiftyFifty: boolean;
  askHost: boolean;
  webSearch: boolean;
}

export interface PlayerStats {
  score: number;
  streak: number;
  highestStreak: number;
  correctCount: number;
  totalAnswered: number;
  history: Array<{
    question: Question;
    selectedOption: number;
    isCorrect: boolean;
    earnedScore: number;
    hostComment?: string;
  }>;
}

export type AppMode = 'game' | 'live-voice';
