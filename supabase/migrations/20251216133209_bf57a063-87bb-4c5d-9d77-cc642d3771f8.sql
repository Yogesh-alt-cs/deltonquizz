-- Fix security definer view issue by dropping and recreating without security definer
DROP VIEW IF EXISTS public.leaderboard;

-- Recreate as regular view (uses invoker's permissions by default)
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