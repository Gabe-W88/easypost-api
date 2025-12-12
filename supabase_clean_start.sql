-- ============================================
-- CLEAN START - DROP AND RECREATE EVERYTHING
-- ============================================
-- WARNING: This will DELETE ALL existing data!
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Drop existing views and table
-- ============================================

DROP VIEW IF EXISTS application_dashboard CASCADE;
DROP VIEW IF EXISTS application_addresses CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- ============================================
-- STEP 2: Create fresh applications table
-- ============================================

CREATE TABLE applications (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,
  application_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Payment information
  payment_status VARCHAR(50) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_payment_method_id TEXT,
  stripe_session_id VARCHAR(255),
  stripe_charge_id VARCHAR(255),
  payment_completed_at TIMESTAMPTZ,
  amount_paid DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'usd',
  
  -- Fulfillment and automation
  fulfillment_type TEXT DEFAULT 'manual',
  make_automation_triggered_at TIMESTAMPTZ,
  make_automation_status TEXT,
  make_automation_error TEXT,
  processing_status TEXT,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  
  -- JSONB fields (for full data storage)
  form_data JSONB,
  file_urls JSONB,
  file_data JSONB,
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
  
  -- Stripe shipping data (from payment)
  shipping_name TEXT, -- From Stripe PaymentElement
  shipping_phone TEXT, -- From Stripe PaymentElement
  
  -- International shipping fields
  shipping_country VARCHAR(2),
  international_full_address TEXT,
  international_local_address TEXT,
  international_delivery_instructions TEXT,
  pccc_code VARCHAR(255),
  korean_pccc TEXT,
  
  -- Billing information (from Stripe)
  billing_name TEXT,
  billing_email TEXT,
  billing_phone TEXT,
  
  -- Shipping tracking (from EasyPost)
  easypost_shipment_id TEXT,
  tracking_code TEXT,
  tracking_url TEXT,
  shipping_carrier TEXT,
  shipping_service TEXT,
  shipping_cost NUMERIC,
  estimated_delivery_date DATE,
  shipping_label_url TEXT,
  shipping_label_pdf_url TEXT,
  work_order_pdf_url TEXT,
  work_order_sent_at TIMESTAMPTZ,
  customer_thank_you_sent_at TIMESTAMPTZ
);

-- ============================================
-- STEP 3: Add indexes for performance
-- ============================================

CREATE INDEX idx_applications_application_id ON applications(application_id);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_payment_status ON applications(payment_status);
CREATE INDEX idx_applications_created_at ON applications(created_at);
CREATE INDEX idx_applications_shipping_category ON applications(shipping_category);
CREATE INDEX idx_applications_fulfillment_type ON applications(fulfillment_type);

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

CREATE TRIGGER update_applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 5: Verify table was created
-- ============================================

SELECT 
  'Table created successfully!' as status,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'applications';

-- ============================================
-- DONE!
-- ============================================
-- Your applications table is now clean and ready.
-- Test a form submission to verify it works.

