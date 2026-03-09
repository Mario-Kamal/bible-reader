
-- Weekly competitions table
CREATE TABLE public.competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active competitions"
  ON public.competitions FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage competitions"
  ON public.competitions FOR ALL
  USING (is_admin());

-- Competition answers table
CREATE TABLE public.competition_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answer character(1) NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  points_earned integer NOT NULL DEFAULT 0,
  answered_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(competition_id, user_id, question_id)
);

ALTER TABLE public.competition_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers"
  ON public.competition_answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers"
  ON public.competition_answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all answers"
  ON public.competition_answers FOR SELECT
  USING (is_admin());

-- Link questions to competitions
ALTER TABLE public.questions ADD COLUMN competition_id uuid REFERENCES public.competitions(id) ON DELETE SET NULL;

-- Enable realtime for competition answers (for live leaderboard)
ALTER PUBLICATION supabase_realtime ADD TABLE public.competition_answers;
