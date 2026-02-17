import { supabase } from "@/integrations/supabase/client";

interface QuizHistoryParams {
  userId: string;
  quizId?: string;
  quizTitle: string;
  category?: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeTakenSeconds: number;
  mode: 'solo' | 'multiplayer' | 'tournament' | 'study' | 'practice' | 'timed' | 'battle';
  maxStreak?: number;
  completed: boolean;
}

export async function saveQuizHistory(params: QuizHistoryParams): Promise<boolean> {
  try {
    const { error } = await supabase.from('quiz_history').insert({
      user_id: params.userId,
      quiz_id: params.quizId || null,
      quiz_title: params.quizTitle,
      category: params.category || null,
      score: params.score,
      total_questions: params.totalQuestions,
      correct_answers: params.correctAnswers,
      accuracy: params.accuracy,
      time_taken_seconds: params.timeTakenSeconds,
      mode: params.mode,
      max_streak: params.maxStreak || 0,
      completed: params.completed,
    });

    if (error) {
      console.error("Quiz History Save Failed:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Quiz History Save Exception:", err);
    return false;
  }
}
