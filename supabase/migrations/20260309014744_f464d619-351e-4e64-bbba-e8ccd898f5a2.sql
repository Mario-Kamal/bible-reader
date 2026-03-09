-- Add streak columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reading_date date;

-- Update the update_user_stats function with streak logic
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  last_date date;
  curr_streak integer;
  new_streak integer;
  today date;
BEGIN
  today := (NEW.completed_at AT TIME ZONE 'Africa/Cairo')::date;
  
  SELECT last_reading_date, current_streak 
  INTO last_date, curr_streak
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- Calculate new streak
  IF last_date IS NULL THEN
    new_streak := 1;
  ELSIF last_date = today THEN
    -- Already read today, keep current streak unchanged
    new_streak := curr_streak;
  ELSIF last_date = today - INTERVAL '1 day' THEN
    -- Consecutive day - increment streak
    new_streak := curr_streak + 1;
  ELSE
    -- Gap in reading - reset streak
    new_streak := 1;
  END IF;
  
  UPDATE public.profiles
  SET 
    total_points = total_points + NEW.points_earned,
    topics_completed = topics_completed + 1,
    current_streak = new_streak,
    longest_streak = GREATEST(COALESCE(longest_streak, 0), new_streak),
    last_reading_date = today,
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_user_progress_insert'
  ) THEN
    CREATE TRIGGER on_user_progress_insert
    AFTER INSERT ON public.user_progress
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_stats();
  END IF;
END;
$$;