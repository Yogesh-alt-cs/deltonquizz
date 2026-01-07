-- Fix function search paths for security
DROP FUNCTION IF EXISTS public.calculate_level(INTEGER);
CREATE OR REPLACE FUNCTION public.calculate_level(xp_amount INTEGER)
RETURNS INTEGER 
LANGUAGE plpgsql 
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN GREATEST(1, FLOOR((-1 + SQRT(1 + 8 * xp_amount::FLOAT / 100)) / 2)::INTEGER + 1);
END;
$$;