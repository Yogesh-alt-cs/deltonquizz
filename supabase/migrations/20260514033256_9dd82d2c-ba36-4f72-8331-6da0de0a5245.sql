
-- 1. Profiles: respect privacy_setting
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public or own profile viewable"
  ON public.profiles FOR SELECT
  USING (privacy_setting = 'public' OR auth.uid() = id);

-- 2. Leaderboard view: use security_invoker so profile RLS applies
ALTER VIEW public.leaderboard SET (security_invoker = true);

-- 3. Game rooms: restrict SELECT to authenticated users only (was public)
DROP POLICY IF EXISTS "Game rooms are viewable by everyone" ON public.game_rooms;
CREATE POLICY "Authenticated users can view game rooms"
  ON public.game_rooms FOR SELECT
  TO authenticated
  USING (true);

-- 4. Harden update_profile_stats with bounds checking
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  safe_score integer;
  safe_streak integer;
BEGIN
  -- Clamp values to reasonable bounds to prevent stat manipulation
  safe_score := LEAST(GREATEST(COALESCE(NEW.score, 0), 0), 100000);
  safe_streak := LEAST(GREATEST(COALESCE(NEW.max_streak, 0), 0), 1000);

  IF NEW.completed = true AND (OLD.completed IS DISTINCT FROM true) THEN
    UPDATE public.profiles
    SET
      total_score = COALESCE(total_score, 0) + safe_score,
      total_quizzes_played = COALESCE(total_quizzes_played, 0) + 1,
      highest_streak = GREATEST(COALESCE(highest_streak, 0), safe_streak),
      updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Harden handle_new_user with username sanitization
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  raw_username text;
  safe_username text;
BEGIN
  raw_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
  -- Strip non-allowed characters, limit to 30 chars, fallback if empty
  safe_username := substring(regexp_replace(raw_username, '[^a-zA-Z0-9_.-]', '', 'g') from 1 for 30);
  IF safe_username IS NULL OR length(safe_username) < 2 THEN
    safe_username := 'user_' || substring(NEW.id::text from 1 for 8);
  END IF;

  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, safe_username)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
