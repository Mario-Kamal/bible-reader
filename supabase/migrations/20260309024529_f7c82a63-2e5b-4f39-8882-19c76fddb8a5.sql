
-- Table to store relationships between prophecies
CREATE TABLE public.topic_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  target_topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  relationship_type text NOT NULL DEFAULT 'related',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(source_topic_id, target_topic_id)
);

ALTER TABLE public.topic_links ENABLE ROW LEVEL SECURITY;

-- Everyone can view links for published topics
CREATE POLICY "Everyone can view topic links"
ON public.topic_links
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (SELECT 1 FROM topics WHERE topics.id = topic_links.source_topic_id AND topics.is_published = true)
  AND EXISTS (SELECT 1 FROM topics WHERE topics.id = topic_links.target_topic_id AND topics.is_published = true)
);

-- Admins can manage links
CREATE POLICY "Admins can manage topic links"
ON public.topic_links
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());
