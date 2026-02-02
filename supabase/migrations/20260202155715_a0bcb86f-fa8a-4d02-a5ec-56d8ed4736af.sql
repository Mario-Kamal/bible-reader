-- Create daily_verses table for storing AI-generated daily verses
CREATE TABLE public.daily_verses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verse_date DATE NOT NULL UNIQUE,
  book VARCHAR(100) NOT NULL,
  chapter INTEGER NOT NULL,
  verse_number INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

-- Everyone can read daily verses
CREATE POLICY "Daily verses are viewable by everyone"
ON public.daily_verses
FOR SELECT
USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage daily verses"
ON public.daily_verses
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create index for fast date lookup
CREATE INDEX idx_daily_verses_date ON public.daily_verses(verse_date);