export type TestMode = "time" | "words" | "quote" | "zen";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  bestWpm: number;
  role: "user" | "admin";
  isVerified: boolean;
  hasPassword: boolean;
}

export interface TestResultRecord {
  _id: string;
  mode: TestMode;
  amount: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  bestWpm: number;
  accuracy: number;
  achievedAt: string;
}

export interface RaceParticipant {
  userId: string;
  username: string;
  progress: number;
  wpm: number;
  accuracy: number;
  finished: boolean;
  place?: number;
}

export interface RaceRecord {
  _id: string;
  code: string;
  host: string;
  mode: "words" | "time";
  amount: number;
  text: string[];
  status: "waiting" | "active" | "finished";
}
