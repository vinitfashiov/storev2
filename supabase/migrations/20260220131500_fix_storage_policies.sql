
-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'store-assets' );

-- Policy to allow authenticated uploads
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'store-assets' );

-- Policy to allow authenticated updates
CREATE POLICY "Authenticated Updates"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'store-assets' );

-- Policy to allow authenticated deletes
CREATE POLICY "Authenticated Deletes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'store-assets' );
