-- Supabase Migration: Add Required Columns to Applications Table
-- Run this in Supabase SQL Editor
-- Date: Current Session
-- Purpose: Add all columns needed to capture complete application data

-- ============================================
-- STEP 1: Add Missing Columns
-- ============================================
-- Copy and paste this entire section into Supabase SQL Editor and run it

ALTER TABLE applications
  -- Personal information
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  
  -- License information
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS license_state TEXT,
  ADD COLUMN IF NOT EXISTS license_expiration DATE,
  ADD COLUMN IF NOT EXISTS license_types JSONB,
  
  -- Travel and permit information
  ADD COLUMN IF NOT EXISTS selected_permits JSONB,
  ADD COLUMN IF NOT EXISTS drive_abroad TEXT,
  ADD COLUMN IF NOT EXISTS departure_date DATE,
  ADD COLUMN IF NOT EXISTS permit_effective_date DATE,
  
  -- Processing and shipping
  ADD COLUMN IF NOT EXISTS shipping_category TEXT,
  ADD COLUMN IF NOT EXISTS processing_option TEXT,
  ADD COLUMN IF NOT EXISTS shipping_label_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS ship_by_date DATE,
  
  -- Shipping address fields (individual columns per CSV requirement)
  ADD COLUMN IF NOT EXISTS shipping_recipient_name TEXT,
  ADD COLUMN IF NOT EXISTS shipping_recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS shipping_street_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_street_address_2 TEXT,
  ADD COLUMN IF NOT EXISTS shipping_city TEXT,
  ADD COLUMN IF NOT EXISTS shipping_state TEXT,
  ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS shipping_delivery_instructions TEXT;

-- ============================================
-- STEP 2: Verify Columns Were Added (Optional)
-- ============================================
-- Run this to verify all columns exist

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
  AND column_name IN (
    'middle_name',
    'license_number',
    'license_state',
    'license_expiration',
    'license_types',
    'selected_permits',
    'drive_abroad',
    'departure_date',
    'permit_effective_date',
    'shipping_category',
    'processing_option',
    'shipping_label_generated',
    'tracking_number',
    'ship_by_date',
    'shipping_recipient_name',
    'shipping_recipient_phone',
    'shipping_street_address',
    'shipping_street_address_2',
    'shipping_city',
    'shipping_state',
    'shipping_postal_code',
    'shipping_delivery_instructions'
  )
ORDER BY column_name;

-- ============================================
-- STEP 3: Backfill Existing Records (If Needed)
-- ============================================
-- Only run this if you have existing application records
-- This populates the new columns from the form_data JSONB field

UPDATE applications
SET
  -- Personal information
  first_name = form_data->>'firstName',
  middle_name = form_data->>'middleName',
  last_name = form_data->>'lastName',
  email = form_data->>'email',
  phone = form_data->>'phone',
  date_of_birth = CASE 
    WHEN form_data->>'dateOfBirth' IS NOT NULL AND form_data->>'dateOfBirth' != '' 
    THEN (form_data->>'dateOfBirth')::DATE 
    ELSE NULL 
  END,
  
  -- License information
  license_number = form_data->>'licenseNumber',
  license_state = form_data->>'licenseState',
  license_expiration = CASE 
    WHEN form_data->>'licenseExpiration' IS NOT NULL AND form_data->>'licenseExpiration' != '' 
    THEN (form_data->>'licenseExpiration')::DATE 
    ELSE NULL 
  END,
  license_types = form_data->'licenseTypes',
  
  -- Address information
  street_address = form_data->>'streetAddress',
  street_address_2 = form_data->>'streetAddress2',
  city = form_data->>'city',
  state = form_data->>'state',
  zip_code = form_data->>'zipCode',
  
  -- Birthplace
  birthplace_city = form_data->>'birthplaceCity',
  birthplace_state = form_data->>'birthplaceState',
  
  -- Travel information
  drive_abroad = form_data->>'driveAbroad',
  departure_date = CASE 
    WHEN form_data->>'departureDate' IS NOT NULL AND form_data->>'departureDate' != '' 
    THEN (form_data->>'departureDate')::DATE 
    ELSE NULL 
  END,
  permit_effective_date = CASE 
    WHEN form_data->>'permitEffectiveDate' IS NOT NULL AND form_data->>'permitEffectiveDate' != '' 
    THEN (form_data->>'permitEffectiveDate')::DATE 
    ELSE NULL 
  END,
  selected_permits = form_data->'selectedPermits',
  
  -- Shipping and processing
  shipping_category = form_data->>'shippingCategory',
  processing_option = form_data->>'processingOption',
  shipping_label_generated = (fulfillment_type = 'automated'),
  
  -- Shipping address fields
  shipping_recipient_name = COALESCE(
    form_data->>'recipientName',
    form_data->>'firstName' || ' ' || form_data->>'lastName'
  ),
  shipping_recipient_phone = COALESCE(
    form_data->>'recipientPhone',
    form_data->>'shippingPhone',
    form_data->>'phone'
  ),
  shipping_street_address = CASE 
    WHEN form_data->>'shippingCategory' != 'international' 
    THEN form_data->>'shippingStreetAddress' 
    ELSE NULL 
  END,
  shipping_street_address_2 = CASE 
    WHEN form_data->>'shippingCategory' != 'international' 
    THEN form_data->>'shippingStreetAddress2' 
    ELSE NULL 
  END,
  shipping_city = CASE 
    WHEN form_data->>'shippingCategory' != 'international' 
    THEN form_data->>'shippingCity' 
    ELSE NULL 
  END,
  shipping_state = CASE 
    WHEN form_data->>'shippingCategory' != 'international' 
    THEN form_data->>'shippingState' 
    ELSE NULL 
  END,
  shipping_postal_code = CASE 
    WHEN form_data->>'shippingCategory' != 'international' 
    THEN form_data->>'shippingPostalCode' 
    ELSE NULL 
  END,
  shipping_delivery_instructions = COALESCE(
    form_data->>'shippingDeliveryInstructions',
    form_data->>'internationalDeliveryInstructions'
  )
WHERE form_data IS NOT NULL
  AND (first_name IS NULL OR shipping_category IS NULL); -- Only update records that haven't been backfilled yet

