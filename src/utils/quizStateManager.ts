const STORAGE_KEY = "quiz_resume_state";

export interface SavedQuizState {
  quizId: string;
  quizTitle: string;
  questions: any[];
  currentQuestionIndex: number;
  score: number;
  lives: number;
  streak: number;
  maxStreak: number;
  combo: number;
  correctAnswers: number;
  userAnswers: any[];
  savedAt: number;
  startTime: number;
}

export function saveQuizState(state: SavedQuizState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save quiz state:", e);
  }
}

export function loadQuizState(quizId: string): SavedQuizState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state: SavedQuizState = JSON.parse(raw);
    // Only return if it matches the current quiz and is less than 24h old
    if (state.quizId === quizId && Date.now() - state.savedAt < 86400000) {
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearQuizState() {
  localStorage.removeItem(STORAGE_KEY);
}
