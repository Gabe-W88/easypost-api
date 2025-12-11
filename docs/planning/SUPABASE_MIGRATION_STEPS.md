# Supabase Migration Steps

**Purpose:** Add all required columns to the `applications` table so all application data is properly captured.

**Time Required:** 5-10 minutes

---

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"** to create a new SQL query

---

## Step 2: Run the Migration SQL

Copy and paste the following SQL into the SQL Editor, then click **"Run"** (or press `Ctrl+Enter` / `Cmd+Enter`):

```sql
-- Add missing columns to applications table
-- This migration adds all columns needed to capture complete application data

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
```

**Expected Result:** You should see a success message like "Success. No rows returned" or "Query executed successfully"

---

## Step 3: Verify Columns Were Added

Run this query to verify all columns exist:

```sql
-- Check if all new columns exist
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
```

**Expected Result:** You should see 22 rows, one for each new column.

---

## Step 4: Verify Existing Columns (Optional)

Check that these existing columns are present (they should already exist):

```sql
-- Verify existing columns that should be populated
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'applications'
  AND column_name IN (
    'first_name',
    'last_name',
    'email',
    'phone',
    'date_of_birth',
    'street_address',
    'street_address_2',
    'city',
    'state',
    'zip_code',
    'birthplace_city',
    'birthplace_state',
    'amount_paid'
  )
ORDER BY column_name;
```

**Expected Result:** You should see 13 rows. If any are missing, let me know and we'll add them.

---

## Step 5: Backfill Existing Records (If You Have Any)

If you have existing application records in the database, run this to populate the new columns from the `form_data` JSONB field:

```sql
-- Backfill denormalized fields from form_data JSONB
-- Only run this if you have existing records that need to be updated

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
```

**Note:** This will only update records where the new columns are NULL, so it's safe to run multiple times.

---

## Step 6: Verify Backfill (If You Ran Step 5)

Check that existing records were updated:

```sql
-- Check a sample record to verify backfill worked
SELECT 
  application_id,
  first_name,
  last_name,
  email,
  shipping_category,
  processing_option,
  shipping_recipient_name
FROM applications
WHERE form_data IS NOT NULL
LIMIT 5;
```

---

## Troubleshooting

### Error: "column already exists"
**Solution:** This is fine! The `IF NOT EXISTS` clause means the migration is idempotent. You can run it multiple times safely.

### Error: "permission denied"
**Solution:** Make sure you're logged in as a project owner or have the necessary permissions. You may need to use the service role key.

### Error: "relation 'applications' does not exist"
**Solution:** Check that you're in the correct project and that the table name is correct. It should be `applications` (lowercase).

### Columns not showing up
**Solution:** 
1. Refresh the Supabase dashboard
2. Check the Table Editor to see if columns appear
3. Run the verification query (Step 3) to confirm

---

## Next Steps

After completing the migration:

1. ✅ **Verify all columns exist** (Step 3)
2. ✅ **Backfill existing records** (Step 5, if needed)
3. ✅ **Notify me** - I'll update the code to start saving data to these columns
4. ✅ **Test** - Submit a test application and verify data appears in Supabase

---

## Quick Reference: All New Columns

| Column Name | Type | Purpose |
|------------|------|---------|
| `middle_name` | TEXT | Middle name |
| `license_number` | TEXT | Driver's license number |
| `license_state` | TEXT | License state of issue |
| `license_expiration` | DATE | License expiration date |
| `license_types` | JSONB | Array of license types |
| `selected_permits` | JSONB | Array of selected permits |
| `drive_abroad` | TEXT | Where they will drive |
| `departure_date` | DATE | Departure date from USA |
| `permit_effective_date` | DATE | Permit effective date |
| `shipping_category` | TEXT | domestic/international/military |
| `processing_option` | TEXT | standard/fast/fastest |
| `shipping_label_generated` | BOOLEAN | Auto-generated label flag |
| `tracking_number` | TEXT | EasyPost tracking number |
| `ship_by_date` | DATE | Calculated ship-by date |
| `shipping_recipient_name` | TEXT | Shipping recipient name |
| `shipping_recipient_phone` | TEXT | Shipping recipient phone |
| `shipping_street_address` | TEXT | Shipping street address |
| `shipping_street_address_2` | TEXT | Shipping address line 2 |
| `shipping_city` | TEXT | Shipping city |
| `shipping_state` | TEXT | Shipping state |
| `shipping_postal_code` | TEXT | Shipping postal code |
| `shipping_delivery_instructions` | TEXT | Delivery instructions |

---

**Status:** Ready to execute  
**Estimated Time:** 5-10 minutes  
**Risk Level:** Low (using IF NOT EXISTS, safe to run multiple times)

