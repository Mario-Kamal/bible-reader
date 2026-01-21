-- Add audio_url column to topics table for admin voice recordings
ALTER TABLE public.topics 
ADD COLUMN audio_url TEXT;

-- Add comment
COMMENT ON COLUMN public.topics.audio_url IS 'Optional admin voice recording URL';