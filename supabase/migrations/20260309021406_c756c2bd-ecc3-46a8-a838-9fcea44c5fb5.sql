-- Church Fathers Commentaries table
CREATE TABLE public.patristic_commentaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  saint_name text NOT NULL,
  saint_title text, -- e.g., "البابا", "القديس", "الأنبا"
  commentary_text text NOT NULL,
  source text, -- Book or document reference
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patristic_commentaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view commentaries of published topics" ON public.patristic_commentaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.topics 
      WHERE topics.id = patristic_commentaries.topic_id 
      AND (topics.is_published = true OR is_admin())
    )
  );

CREATE POLICY "Admins can manage commentaries" ON public.patristic_commentaries
  FOR ALL USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_patristic_commentaries_updated_at
  BEFORE UPDATE ON public.patristic_commentaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();