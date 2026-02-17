-- Fix the tournament_matches status constraint to include all needed values
ALTER TABLE tournament_matches DROP CONSTRAINT IF EXISTS tournament_matches_status_check;

ALTER TABLE tournament_matches
ADD CONSTRAINT tournament_matches_status_check
CHECK (status IN ('pending', 'active', 'completed', 'cancelled'));

-- Create quiz_history table for centralized history tracking
CREATE TABLE IF NOT EXISTS public.quiz_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_id TEXT,
  quiz_title TEXT NOT NULL,
  category TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'solo',
  max_streak INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_history ENABLE ROW LEVEL SECURITY;

-- Users can insert their own history
CREATE POLICY "Users can insert their own history"
ON public.quiz_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own history
CREATE POLICY "Users can view their own history"
ON public.quiz_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete their own history"
ON public.quiz_history
FOR DELETE
USING (auth.uid() = user_id);