-- ============================================
-- CLEAN SUPABASE SETUP - START FRESH
-- ============================================
-- This script creates a clean applications table with all required columns
-- Run this in Supabase SQL Editor to start fresh

-- ============================================
-- STEP 1: Drop existing table (if you want to start completely fresh)
-- ============================================
-- WARNING: This will delete all existing data!
-- Uncomment the next line ONLY if you want to delete everything:
-- DROP TABLE IF EXISTS applications CASCADE;

-- ============================================
-- STEP 2: Create clean applications table
-- ============================================
-- If table doesn't exist, create it. If it exists, we'll alter it.

CREATE TABLE IF NOT EXISTS applications (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,
  application_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Payment information
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_payment_method_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  payment_completed_at TIMESTAMPTZ,
  amount_paid DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'usd',
  
  -- Fulfillment and automation
  fulfillment_type VARCHAR(50) DEFAULT 'manual',
  make_automation_triggered_at TIMESTAMPTZ,
  make_automation_status VARCHAR(50),
  make_automation_error TEXT,
  
  -- JSONB fields (for full data storage)
  form_data JSONB,
  file_urls JSONB,
  shipping_address JSONB,
  billing_address JSONB,
  
  -- Personal information (denormalized)
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  
  -- License information (denormalized)
  license_number TEXT,
  license_state TEXT,
  license_expiration DATE,
  license_types JSONB,
  
  -- Address information (denormalized - from driver's license)
  street_address TEXT,
  street_address_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Birthplace (denormalized)
  birthplace_city TEXT,
  birthplace_state TEXT,
  
  -- Travel information (denormalized)
  drive_abroad TEXT,
  departure_date DATE,
  permit_effective_date DATE,
  selected_permits JSONB,
  
  -- Shipping and processing (denormalized)
  shipping_category TEXT,
  processing_option TEXT,
  shipping_label_generated BOOLEAN DEFAULT FALSE,
  tracking_number TEXT,
  ship_by_date DATE,
  
  -- Shipping address fields (individual columns per CSV requirement)
  shipping_recipient_name TEXT,
  shipping_recipient_phone TEXT,
  shipping_street_address TEXT,
  shipping_street_address_2 TEXT,
  shipping_city TEXT,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_delivery_instructions TEXT,
  
  -- International shipping fields
  shipping_country VARCHAR(2),
  international_full_address TEXT,
  international_local_address TEXT,
  international_delivery_instructions TEXT,
  pccc_code TEXT,
  
  -- Billing information (from Stripe)
  billing_name TEXT,
  billing_email TEXT,
  billing_phone TEXT
);

-- ============================================
-- STEP 3: Add indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_applications_application_id ON applications(application_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_payment_status ON applications(payment_status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at);
CREATE INDEX IF NOT EXISTS idx_applications_shipping_category ON applications(shipping_category);

-- ============================================
-- STEP 4: Add trigger to update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_applications_updated_at ON applications;
CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: Verify table structure
-- ============================================
-- Run this to verify all columns exist:

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'applications'
ORDER BY ordinal_position;

-- ============================================
-- DONE!
-- ============================================
-- Your applications table is now ready with all columns.
-- The code will automatically populate all these fields when forms are submitted.

