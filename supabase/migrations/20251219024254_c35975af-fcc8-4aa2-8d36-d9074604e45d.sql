-- Create table for multiplayer game rooms
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code VARCHAR(6) NOT NULL UNIQUE,
  quiz_id UUID REFERENCES public.quizzes(id),
  host_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  current_question INTEGER DEFAULT 0,
  max_players INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Create table for players in game rooms
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  score INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  is_connected BOOLEAN DEFAULT true,
  last_answer_correct BOOLEAN,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for player answers in multiplayer
CREATE TABLE public.game_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL,
  answer_index INTEGER,
  is_correct BOOLEAN NOT NULL,
  time_taken_ms INTEGER,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user achievements
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  requirement_type VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user earned achievements
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for game_rooms
CREATE POLICY "Game rooms are viewable by everyone" ON public.game_rooms FOR SELECT USING (true);
CREATE POLICY "Users can create game rooms" ON public.game_rooms FOR INSERT WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update their game rooms" ON public.game_rooms FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their game rooms" ON public.game_rooms FOR DELETE USING (auth.uid() = host_id);

-- RLS policies for game_players
CREATE POLICY "Game players are viewable by everyone" ON public.game_players FOR SELECT USING (true);
CREATE POLICY "Users can join games" ON public.game_players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own player state" ON public.game_players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave games" ON public.game_players FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for game_answers
CREATE POLICY "Game answers viewable by room participants" ON public.game_answers FOR SELECT USING (true);
CREATE POLICY "Players can submit answers" ON public.game_answers FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.game_players gp WHERE gp.id = player_id AND gp.user_id = auth.uid())
);

-- RLS policies for achievements
CREATE POLICY "Achievements are viewable by everyone" ON public.achievements FOR SELECT USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Users can view all earned achievements" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users can earn achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for multiplayer tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_answers;

-- Set replica identity for realtime
ALTER TABLE public.game_rooms REPLICA IDENTITY FULL;
ALTER TABLE public.game_players REPLICA IDENTITY FULL;
ALTER TABLE public.game_answers REPLICA IDENTITY FULL;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_value, xp_reward) VALUES
('First Quiz', 'Complete your first quiz', 'trophy', 'quizzes_played', 1, 50),
('Quiz Enthusiast', 'Complete 10 quizzes', 'star', 'quizzes_played', 10, 200),
('Quiz Master', 'Complete 50 quizzes', 'crown', 'quizzes_played', 50, 500),
('Hot Streak', 'Get a streak of 5 correct answers', 'flame', 'streak', 5, 100),
('On Fire', 'Get a streak of 10 correct answers', 'zap', 'streak', 10, 250),
('Unstoppable', 'Get a streak of 20 correct answers', 'rocket', 'streak', 20, 500),
('Century', 'Score 100 points in a single quiz', 'target', 'single_score', 100, 75),
('High Scorer', 'Score 500 points in a single quiz', 'medal', 'single_score', 500, 200),
('Point Machine', 'Score 1000 points in a single quiz', 'award', 'single_score', 1000, 400),
('Social Player', 'Play your first multiplayer game', 'users', 'multiplayer_games', 1, 100),
('Team Player', 'Play 10 multiplayer games', 'users', 'multiplayer_games', 10, 300),
('Multiplayer Champion', 'Win 5 multiplayer games', 'crown', 'multiplayer_wins', 5, 500);