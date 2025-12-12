-- Add missing columns for Stripe shipping data
-- Run this in Supabase SQL Editor
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS shipping_name TEXT,
ADD COLUMN IF NOT EXISTS shipping_phone TEXT;

