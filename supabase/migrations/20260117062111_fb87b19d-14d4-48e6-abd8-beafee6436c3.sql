-- =====================================================
-- SECURITY FIX: Add tenant isolation to product-images storage bucket
-- =====================================================

-- Drop the overly permissive storage policies
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;

-- Create tenant-scoped storage policies for product-images
-- Only tenant owners can upload images to their own folder
CREATE POLICY "Owners can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = get_user_tenant_id()::text
);

-- Only tenant owners can update images in their own folder
CREATE POLICY "Owners can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = get_user_tenant_id()::text
);

-- Only tenant owners can delete images from their own folder
CREATE POLICY "Owners can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND (storage.foldername(name))[1] = get_user_tenant_id()::text
);