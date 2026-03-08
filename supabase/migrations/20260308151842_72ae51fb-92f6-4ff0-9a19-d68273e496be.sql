
-- Security definer function to check admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = _user_id),
    false
  )
$$;

-- Allow admins to delete any quiz
DROP POLICY IF EXISTS "Users can delete own quizzes" ON public.quizzes;
CREATE POLICY "Users can delete own quizzes" ON public.quizzes
FOR DELETE USING (auth.uid() = creator_id OR public.is_admin(auth.uid()));

-- Allow admins to update any quiz
DROP POLICY IF EXISTS "Users can update own quizzes" ON public.quizzes;
CREATE POLICY "Users can update own quizzes" ON public.quizzes
FOR UPDATE USING (auth.uid() = creator_id OR public.is_admin(auth.uid()));

-- Allow admins to delete questions from any quiz
DROP POLICY IF EXISTS "Users can delete questions from own quizzes" ON public.questions;
CREATE POLICY "Users can delete questions from own quizzes" ON public.questions
FOR DELETE USING (
  EXISTS (SELECT 1 FROM quizzes q WHERE q.id = questions.quiz_id AND q.creator_id = auth.uid())
  OR public.is_admin(auth.uid())
);

-- Allow admins to view all quiz sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.quiz_sessions;
CREATE POLICY "Users can view own sessions" ON public.quiz_sessions
FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
