-- Fix RLS policies for client's Supabase
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Enable RLS on applications table
-- ============================================
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create policy to allow INSERT (for form submissions)
-- ============================================
CREATE POLICY "Allow public inserts" ON applications
    FOR INSERT
    TO public
    WITH CHECK (true);

-- ============================================
-- STEP 3: Create policy to allow SELECT (for reading data)
-- ============================================
CREATE POLICY "Allow public selects" ON applications
    FOR SELECT
    TO public
    USING (true);

-- ============================================
-- STEP 4: Create policy to allow UPDATE (for webhook updates)
-- ============================================
CREATE POLICY "Allow public updates" ON applications
    FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- ============================================
-- STEP 5: Fix Storage bucket policies
-- ============================================

-- Make sure the bucket exists and is public
UPDATE storage.buckets
SET public = true
WHERE id = 'application-files';

-- Allow public uploads to the bucket
CREATE POLICY "Allow public uploads" ON storage.objects
    FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'application-files');

-- Allow public reads from the bucket
CREATE POLICY "Allow public reads" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'application-files');

-- Allow public updates (for file replacements)
CREATE POLICY "Allow public updates" ON storage.objects
    FOR UPDATE
    TO public
    USING (bucket_id = 'application-files')
    WITH CHECK (bucket_id = 'application-files');

