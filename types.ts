
export interface FlashcardData {
  english: string;
  spanish: string;
  example: string;
  conjugation?: string;
}

export interface PronunciationWord {
  word: string;
  isCorrect: boolean;
}

export interface PronunciationFeedback {
  words: PronunciationWord[];
  phonemesToImprove: string[];
}

export interface WordDefinition {
  translation: string;
  overview: string;
}

export interface WordCorrection {
  original: string;
  corrected: string;
}

export interface Lesson {
  id: string;
  title: string;
  vocabulary: string[];
  theme: string;
  isCustom: boolean;
}

export interface FillInTheBlankExercise {
  question: string; // e.g., "My mother ___ a doctor."
  answer: string;   // e.g., "is"
}

export interface GeneratedLessonMaterials {
  readingText: string;
  flashcards: FlashcardData[];
  chatSystemInstruction: string;
  exercises: {
    fillInTheBlank: FillInTheBlankExercise[];
  };
}

export interface QuizQuestion {
  type: 'true-false' | 'multiple-choice';
  question: string;
  options?: string[]; // For multiple-choice
  answer: string;
}

export interface ClassicStory {
  id: string;
  title: string;
  author: string;
  text: string;
  quiz: QuizQuestion[];
}

export type ButtonColor = 'pink' | 'gold' | 'red' | 'green' | 'blue';
export type BackgroundName = 'white' | 'dark' | 'black' | 'blue';
export type BackgroundMode = 'light' | 'dark';

export interface Theme {
  buttonColor: ButtonColor;
  backgroundName: BackgroundName;
  mode: BackgroundMode;
}

// --- GAMIFICATION & PROGRESS ---
export type AchievementId = 
  | 'streak3' | 'streak7' | 'streak30' 
  | 'points100' | 'points500' | 'points1000'
  | 'firstChat' | 'firstExercise' | 'firstDictation' | 'firstListening'
  | 'verbsMaster' | 'allLessons' | 'pronunciationPro'
  | 'wordWatcher' | 'speakingScenario';

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
}

export interface UserProgress {
  points: number;
  streak: number;
  lastPracticed: string | null; // ISO date string
  achievements: AchievementId[];
  activities: Record<string, { count: number; points: number }>; // e.g. { '2024-07-28': { count: 5, points: 75 } }
}


// --- AI SPEAKING BUDDY ---
export interface SpeakingScenario {
  id: string;
  title: string;
  description: string;
  systemInstruction: string;
}

// --- UI ---
export interface ToastMessage {
  id: number;
  message: string;
}
