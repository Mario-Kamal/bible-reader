-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true);

-- Allow anyone to view audio files
CREATE POLICY "Public audio files are accessible to everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'audio');

-- Allow admins to upload audio files
CREATE POLICY "Admins can upload audio files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'audio' AND is_admin());

-- Allow admins to update audio files
CREATE POLICY "Admins can update audio files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'audio' AND is_admin());

-- Allow admins to delete audio files
CREATE POLICY "Admins can delete audio files"
ON storage.objects FOR DELETE
USING (bucket_id = 'audio' AND is_admin());