-- Create tournaments table
CREATE TABLE public.tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  difficulty TEXT DEFAULT 'medium',
  max_participants INTEGER DEFAULT 32,
  current_round INTEGER DEFAULT 1,
  status TEXT DEFAULT 'registration' CHECK (status IN ('registration', 'in_progress', 'completed', 'cancelled')),
  bracket_type TEXT DEFAULT 'single_elimination' CHECK (bracket_type IN ('single_elimination', 'double_elimination')),
  questions_per_match INTEGER DEFAULT 5,
  time_per_question INTEGER DEFAULT 30,
  registration_ends_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tournament participants table
CREATE TABLE public.tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  seed INTEGER,
  eliminated BOOLEAN DEFAULT false,
  eliminated_in_round INTEGER,
  total_score INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Create tournament matches table
CREATE TABLE public.tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES public.tournament_participants(id),
  player2_id UUID REFERENCES public.tournament_participants(id),
  winner_id UUID REFERENCES public.tournament_participants(id),
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'bye')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, round, match_number)
);

-- Create flashcards table for study mode
CREATE TABLE public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  difficulty TEXT DEFAULT 'medium',
  source_quiz_id UUID REFERENCES public.quizzes(id),
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create flashcard review history
CREATE TABLE public.flashcard_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  quality INTEGER NOT NULL CHECK (quality >= 0 AND quality <= 5),
  reviewed_at TIMESTAMPTZ DEFAULT now()
);

-- Add multiplayer stats to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS multiplayer_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS multiplayer_games INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournaments_won INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tournaments_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#8b5cf6';

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- Tournament policies
CREATE POLICY "Tournaments are viewable by everyone" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Users can create tournaments" ON public.tournaments FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their tournaments" ON public.tournaments FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete their tournaments" ON public.tournaments FOR DELETE USING (auth.uid() = creator_id);

-- Tournament participants policies
CREATE POLICY "Participants are viewable by everyone" ON public.tournament_participants FOR SELECT USING (true);
CREATE POLICY "Users can join tournaments" ON public.tournament_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their participation" ON public.tournament_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can leave tournaments" ON public.tournament_participants FOR DELETE USING (auth.uid() = user_id);

-- Tournament matches policies
CREATE POLICY "Matches are viewable by everyone" ON public.tournament_matches FOR SELECT USING (true);
CREATE POLICY "Tournament creators can manage matches" ON public.tournament_matches FOR ALL USING (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.creator_id = auth.uid())
);

-- Flashcard policies
CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- Flashcard reviews policies
CREATE POLICY "Users can view own reviews" ON public.flashcard_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reviews" ON public.flashcard_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for tournaments
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_matches;