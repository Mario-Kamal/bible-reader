
CREATE TABLE public.weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  target_count integer NOT NULL DEFAULT 5,
  bonus_points integer NOT NULL DEFAULT 20,
  week_start date NOT NULL,
  week_end date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  completed_count integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  bonus_claimed boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Weekly challenges: everyone can view active, admins manage
CREATE POLICY "Everyone can view active challenges"
ON public.weekly_challenges FOR SELECT TO authenticated
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage challenges"
ON public.weekly_challenges FOR ALL TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- User challenge progress
CREATE POLICY "Users can view own challenge progress"
ON public.user_challenge_progress FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenge progress"
ON public.user_challenge_progress FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress"
ON public.user_challenge_progress FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all challenge progress"
ON public.user_challenge_progress FOR SELECT TO authenticated
USING (public.is_admin());
