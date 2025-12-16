-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  total_score INTEGER DEFAULT 0,
  total_quizzes_played INTEGER DEFAULT 0,
  highest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create engineering courses table
CREATE TABLE public.engineering_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.engineering_courses(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  time_limit_seconds INTEGER DEFAULT 30,
  join_code TEXT UNIQUE,
  is_public BOOLEAN DEFAULT true,
  total_plays INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  time_limit_seconds INTEGER DEFAULT 30,
  points INTEGER DEFAULT 10,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create quiz sessions table (for tracking user game sessions)
CREATE TABLE public.quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  score INTEGER DEFAULT 0,
  lives_remaining INTEGER DEFAULT 5,
  current_question INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  time_taken_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create leaderboard view
CREATE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.username,
  p.avatar_url,
  p.total_score,
  p.total_quizzes_played,
  p.highest_streak,
  RANK() OVER (ORDER BY p.total_score DESC) as rank
FROM public.profiles p
WHERE p.username IS NOT NULL
ORDER BY p.total_score DESC;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engineering_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);

-- Engineering courses policies (public read)
CREATE POLICY "Courses are viewable by everyone" ON public.engineering_courses FOR SELECT USING (true);

-- Quizzes policies
CREATE POLICY "Public quizzes are viewable by everyone" ON public.quizzes FOR SELECT USING (is_public = true OR creator_id = auth.uid());
CREATE POLICY "Users can create quizzes" ON public.quizzes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own quizzes" ON public.quizzes FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own quizzes" ON public.quizzes FOR DELETE USING (auth.uid() = creator_id);

-- Questions policies
CREATE POLICY "Questions viewable for accessible quizzes" ON public.questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND (q.is_public = true OR q.creator_id = auth.uid()))
);
CREATE POLICY "Users can add questions to own quizzes" ON public.questions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.creator_id = auth.uid())
);
CREATE POLICY "Users can update questions in own quizzes" ON public.questions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.creator_id = auth.uid())
);
CREATE POLICY "Users can delete questions from own quizzes" ON public.questions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.creator_id = auth.uid())
);

-- Quiz sessions policies
CREATE POLICY "Users can view own sessions" ON public.quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.quiz_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'username');
  RETURN NEW;
END;
$$;

-- Trigger for new user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile stats
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.completed = true AND (OLD IS NULL OR OLD.completed = false) THEN
    UPDATE public.profiles
    SET 
      total_score = total_score + NEW.score,
      total_quizzes_played = total_quizzes_played + 1,
      highest_streak = GREATEST(highest_streak, NEW.max_streak),
      updated_at = now()
    WHERE id = NEW.user_id;
    
    -- Update quiz total plays
    UPDATE public.quizzes
    SET total_plays = total_plays + 1
    WHERE id = NEW.quiz_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for updating stats
CREATE TRIGGER on_quiz_session_complete
  AFTER INSERT OR UPDATE ON public.quiz_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats();

-- Insert default categories
INSERT INTO public.categories (name, slug, description, icon, color) VALUES
  ('Engineering', 'engineering', 'Technical engineering concepts and problems', 'Wrench', 'from-blue-500 to-cyan-500'),
  ('General Knowledge', 'general-knowledge', 'Test your knowledge on various topics', 'Brain', 'from-purple-500 to-pink-500'),
  ('Anime', 'anime', 'Questions about popular anime series', 'Tv', 'from-orange-500 to-red-500'),
  ('Science', 'science', 'Physics, Chemistry, Biology and more', 'FlaskConical', 'from-green-500 to-emerald-500'),
  ('History', 'history', 'Events and figures from the past', 'Landmark', 'from-amber-500 to-yellow-500'),
  ('Technology', 'technology', 'Computers, software, and digital world', 'Cpu', 'from-indigo-500 to-violet-500');

-- Insert engineering courses
INSERT INTO public.engineering_courses (name, code, description, category_id) VALUES
  ('Data Structures & Algorithms', 'DSA101', 'Fundamental data structures and algorithmic concepts', (SELECT id FROM public.categories WHERE slug = 'engineering')),
  ('Database Management', 'DBMS101', 'SQL, NoSQL, and database design principles', (SELECT id FROM public.categories WHERE slug = 'engineering')),
  ('Operating Systems', 'OS101', 'Process management, memory, and file systems', (SELECT id FROM public.categories WHERE slug = 'engineering')),
  ('Computer Networks', 'CN101', 'Networking protocols and architecture', (SELECT id FROM public.categories WHERE slug = 'engineering')),
  ('Software Engineering', 'SE101', 'Software development lifecycle and best practices', (SELECT id FROM public.categories WHERE slug = 'engineering')),
  ('Machine Learning', 'ML101', 'Fundamentals of AI and machine learning', (SELECT id FROM public.categories WHERE slug = 'engineering')),
  ('Web Development', 'WEB101', 'Frontend and backend web technologies', (SELECT id FROM public.categories WHERE slug = 'engineering')),
  ('Electrical Circuits', 'EC101', 'Circuit analysis and electronics', (SELECT id FROM public.categories WHERE slug = 'engineering'));