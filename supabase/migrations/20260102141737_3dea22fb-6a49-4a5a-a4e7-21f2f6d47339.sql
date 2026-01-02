-- Create storage bucket for high-res satellite imagery
INSERT INTO storage.buckets (id, name, public)
VALUES ('satellite-imagery', 'satellite-imagery', true);

-- Allow public read access to satellite images
CREATE POLICY "Public can view satellite imagery"
ON storage.objects
FOR SELECT
USING (bucket_id = 'satellite-imagery');

-- Allow authenticated uploads (optional for admin)
CREATE POLICY "Admin can upload satellite imagery"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'satellite-imagery');