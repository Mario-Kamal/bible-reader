-- Reading Plans table (monthly plans)
CREATE TABLE public.reading_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_topics integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Weekly Goals table
CREATE TABLE public.weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  title text NOT NULL,
  description text,
  topics_count integer NOT NULL DEFAULT 7,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_id, week_number)
);

-- User Plan Progress table
CREATE TABLE public.user_plan_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.reading_plans(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(user_id, plan_id)
);

-- Enable RLS
ALTER TABLE public.reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reading_plans
CREATE POLICY "Everyone can view active plans" ON public.reading_plans
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage plans" ON public.reading_plans
  FOR ALL USING (is_admin());

-- RLS Policies for weekly_goals
CREATE POLICY "Everyone can view goals of active plans" ON public.weekly_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reading_plans 
      WHERE id = weekly_goals.plan_id AND (is_active = true OR is_admin())
    )
  );

CREATE POLICY "Admins can manage weekly goals" ON public.weekly_goals
  FOR ALL USING (is_admin());

-- RLS Policies for user_plan_progress
CREATE POLICY "Users can view own progress" ON public.user_plan_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in plans" ON public.user_plan_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_plan_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress" ON public.user_plan_progress
  FOR SELECT USING (is_admin());