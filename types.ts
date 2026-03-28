
export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  svgIllustration?: string;
}

export interface CardData {
  id: number;
  content: string;
  isFlipped: boolean;
  isMatched: boolean;
  question?: QuizQuestion;
}

export interface TeamConfig {
  name: string;
  theme: string; // key for color presets
  icon: string;
  bg: string;
  border: string;
  shadow: string;
  text: string;
  light: string;
}

export enum GameStatus {
  IDLE = 'IDLE',
  SETUP = 'SETUP',
  LOADING = 'LOADING',
  RANDOMIZING = 'RANDOMIZING',
  PLAYING = 'PLAYING',
  QUESTION = 'QUESTION',
  WON = 'WON'
}

export interface GameTheme {
  name: string;
  items: {
    emoji: string;
    quiz: QuizQuestion;
  }[];
}
