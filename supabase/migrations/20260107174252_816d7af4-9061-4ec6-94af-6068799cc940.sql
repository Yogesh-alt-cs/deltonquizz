-- Add XP, level, and gamification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS daily_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE,
ADD COLUMN IF NOT EXISTS privacy_setting TEXT DEFAULT 'public';

-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, blocked
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS on friends
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Friends policies
CREATE POLICY "Users can view their own friendships" ON public.friends
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests" ON public.friends
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships" ON public.friends
FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships" ON public.friends
FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create challenges table for head-to-head quizzes
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenged_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, completed, declined, expired
  challenger_score INTEGER,
  challenged_score INTEGER,
  challenger_time_seconds INTEGER,
  challenged_time_seconds INTEGER,
  winner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days')
);

-- Enable RLS on challenges
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Challenges policies
CREATE POLICY "Users can view challenges they're part of" ON public.challenges
FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

CREATE POLICY "Users can create challenges" ON public.challenges
FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their challenges" ON public.challenges
FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- achievement, streak, mastery, social, challenge
  requirement_type TEXT NOT NULL, -- quizzes_completed, streak_days, xp_earned, accuracy, challenges_won, friends_added
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone" ON public.badges
FOR SELECT USING (true);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User badges are viewable by everyone" ON public.user_badges
FOR SELECT USING (true);

CREATE POLICY "Users can earn badges" ON public.user_badges
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create quiz_recommendations table to track user performance per topic
CREATE TABLE IF NOT EXISTS public.user_topic_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  average_time_seconds REAL DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, topic)
);

-- Enable RLS on user_topic_stats
ALTER TABLE public.user_topic_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own stats" ON public.user_topic_stats
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their stats" ON public.user_topic_stats
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their stats" ON public.user_topic_stats
FOR UPDATE USING (auth.uid() = user_id);

-- Create learning_goals table
CREATE TABLE IF NOT EXISTS public.learning_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  target_topic TEXT,
  target_accuracy INTEGER DEFAULT 80,
  target_quizzes_per_week INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on learning_goals
ALTER TABLE public.learning_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their learning goals" ON public.learning_goals
FOR ALL USING (auth.uid() = user_id);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, xp_reward) VALUES
('First Steps', 'Complete your first quiz', '🎯', 'achievement', 'quizzes_completed', 1, 50),
('Quiz Enthusiast', 'Complete 10 quizzes', '📚', 'achievement', 'quizzes_completed', 10, 100),
('Quiz Master', 'Complete 50 quizzes', '🏆', 'achievement', 'quizzes_completed', 50, 250),
('Quiz Legend', 'Complete 100 quizzes', '👑', 'achievement', 'quizzes_completed', 100, 500),
('Perfect Score', 'Get 100% accuracy on a quiz', '💯', 'mastery', 'accuracy', 100, 100),
('Sharp Mind', 'Maintain 80% accuracy over 10 quizzes', '🧠', 'mastery', 'accuracy', 80, 150),
('On Fire', 'Achieve a 7-day streak', '🔥', 'streak', 'streak_days', 7, 200),
('Dedicated Learner', 'Achieve a 30-day streak', '⚡', 'streak', 'streak_days', 30, 500),
('Social Butterfly', 'Add 5 friends', '🦋', 'social', 'friends_added', 5, 100),
('Champion', 'Win 10 challenges', '🥇', 'challenge', 'challenges_won', 10, 200),
('XP Hunter', 'Earn 1000 XP', '✨', 'achievement', 'xp_earned', 1000, 100),
('Level Up', 'Reach level 5', '⬆️', 'achievement', 'level_reached', 5, 150),
('Speed Demon', 'Complete a quiz in under 60 seconds', '⏱️', 'achievement', 'speed', 60, 100)
ON CONFLICT (name) DO NOTHING;

-- Create function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp_amount INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: each level requires more XP than the last
  -- Level 1: 0 XP, Level 2: 100 XP, Level 3: 300 XP, Level 4: 600 XP, etc.
  RETURN GREATEST(1, FLOOR((-1 + SQRT(1 + 8 * xp_amount::FLOAT / 100)) / 2)::INTEGER + 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to award XP and update level
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_xp_amount INTEGER,
  p_reason TEXT DEFAULT 'quiz_completion'
)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, leveled_up BOOLEAN) AS $$
DECLARE
  v_current_xp INTEGER;
  v_current_level INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO v_current_xp, v_current_level
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0, 1, false;
    RETURN;
  END IF;
  
  v_new_xp := COALESCE(v_current_xp, 0) + p_xp_amount;
  v_new_level := public.calculate_level(v_new_xp);
  
  -- Update profile
  UPDATE public.profiles
  SET xp = v_new_xp, level = v_new_level, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN QUERY SELECT v_new_xp, v_new_level, (v_new_level > COALESCE(v_current_level, 1));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to update daily streak
CREATE OR REPLACE FUNCTION public.update_daily_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_activity_date, daily_streak INTO v_last_date, v_current_streak
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF v_last_date IS NULL OR v_last_date < v_today - 1 THEN
    -- Streak broken or first activity
    v_current_streak := 1;
  ELSIF v_last_date = v_today - 1 THEN
    -- Consecutive day
    v_current_streak := COALESCE(v_current_streak, 0) + 1;
  ELSIF v_last_date = v_today THEN
    -- Already played today
    RETURN v_current_streak;
  END IF;
  
  UPDATE public.profiles
  SET daily_streak = v_current_streak, last_activity_date = v_today, updated_at = now()
  WHERE id = p_user_id;
  
  RETURN v_current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for challenges and friends
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friends;