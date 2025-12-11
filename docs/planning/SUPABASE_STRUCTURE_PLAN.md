# Supabase Database Structure Plan

**Goal:** Ensure Supabase has all necessary columns to automatically capture and display all application data, making it the single source of truth for tracking applications.

**Status:** Investigation Complete - Ready for Implementation

---

## Current State Analysis

### What's Currently Being Saved

#### In `save-application.js` (Initial Submission):
- ✅ `application_id` - Unique ID
- ✅ `form_data` - JSONB with all form fields
- ✅ `file_urls` - JSONB with file metadata
- ✅ `payment_status` - 'pending'
- ✅ `fulfillment_type` - 'automated' or 'manual'
- ✅ `international_full_address` - For international shipping
- ✅ `international_local_address` - For international shipping
- ✅ `international_delivery_instructions` - For international shipping
- ✅ `shipping_country` - Normalized 2-character code
- ✅ `pccc_code` - For Korean customs

#### In `webhook.js` (After Payment):
- ✅ `payment_status` - Updated to 'completed'
- ✅ `stripe_payment_intent_id` - Stripe PaymentIntent ID
- ✅ `stripe_payment_method_id` - Payment method ID
- ✅ `payment_completed_at` - Timestamp
- ✅ `billing_address` - JSONB from Stripe
- ✅ `billing_name`, `billing_email`, `billing_phone` - Billing info
- ✅ `shipping_address` - JSONB from Stripe (for domestic/military)
- ✅ `shipping_name`, `shipping_phone` - Shipping contact info
- ✅ `make_automation_triggered_at` - When Make.com was called
- ✅ `make_automation_status` - 'processing'/'completed'/'failed'

### What's Missing (Not Denormalized to Columns)

Based on the Google Sheets requirements, these fields are currently **only in `form_data` JSONB** but should be **denormalized to columns** for easy querying and display:

#### Personal Information:
- ❌ `middle_name` - Currently only in form_data
- ❌ `date_of_birth` - Exists in schema but not being saved in save-application.js
- ❌ `phone` - Exists in schema but not being saved in save-application.js
- ❌ `email` - Exists in schema but not being saved in save-application.js
- ❌ `first_name` - Exists in schema but not being saved in save-application.js
- ❌ `last_name` - Exists in schema but not being saved in save-application.js

#### License Information:
- ❌ `license_number` - Currently only in form_data
- ❌ `license_state` - Currently only in form_data
- ❌ `license_expiration` - Currently only in form_data
- ❌ `street_address` - Exists in schema but not being saved
- ❌ `street_address_2` - Exists in schema but not being saved
- ❌ `city` - Exists in schema but not being saved
- ❌ `state` - Exists in schema but not being saved
- ❌ `zip_code` - Exists in schema but not being saved

#### Travel & Permit Information:
- ❌ `drive_abroad` - Where they will drive
- ❌ `departure_date` - Departure date from USA
- ❌ `permit_effective_date` - When permit should be effective
- ❌ `selected_permits` - Array of permits (IDP, IADP)
- ❌ `license_types` - Array of license types (passenger, motorcycle, commercial, other)

#### Shipping & Processing:
- ❌ `shipping_category` - 'domestic', 'international', 'military'
- ❌ `processing_option` - 'standard', 'fast', 'fastest'
- ❌ `amount_paid` - Transaction value (exists in schema but not being saved)
- ❌ `shipping_label_generated` - Whether label was auto-generated (y/n)
- ❌ `tracking_number` - EasyPost tracking number (when available)
- ❌ `ship_by_date` - Calculated based on processing time

#### Additional Fields Needed:
- ❌ `birthplace_city` - Exists in schema but not being saved
- ❌ `birthplace_state` - Exists in schema but not being saved

---

## Required Supabase Schema Changes

### Columns That Need to Be Added

These columns don't exist in the current schema but are needed:

```sql
-- License types and endorsements (stored as arrays or JSONB)
license_types JSONB,  -- ['passenger', 'motorcycle', 'commercial', 'other']
selected_permits JSONB,  -- ['idp', 'iadp']

-- Travel information
drive_abroad TEXT,  -- Where they will drive abroad
departure_date DATE,  -- Departure date from USA
permit_effective_date DATE,  -- Permit effective date

-- Processing and shipping
shipping_category TEXT,  -- 'domestic', 'international', 'military'
processing_option TEXT,  -- 'standard', 'fast', 'fastest'
shipping_label_generated BOOLEAN,  -- true if automated, false if manual
tracking_number TEXT,  -- EasyPost tracking number (updated later)
ship_by_date DATE,  -- Calculated ship-by date

-- Additional denormalized fields
middle_name TEXT,  -- Middle name (optional)
```

### Columns That Exist But Aren't Being Populated

These columns exist in the schema but are not being saved in `save-application.js`:

```sql
-- Personal info (exist but not populated)
first_name TEXT,
last_name TEXT,
middle_name TEXT,  -- May need to be added
email TEXT,
phone TEXT,
date_of_birth DATE,

-- License info (exist but not populated)
license_number TEXT,  -- Need to add
license_state TEXT,  -- Need to add
license_expiration DATE,  -- Need to add

-- Address info (exist but not populated)
street_address TEXT,
street_address_2 TEXT,
city TEXT,
state TEXT,
zip_code TEXT,

-- Birthplace (exist but not populated)
birthplace_city TEXT,
birthplace_state TEXT,

-- Payment info (exists but not populated)
amount_paid DECIMAL,  -- Should be set in webhook.js
```

---

## Implementation Plan

### Phase 1: Update Supabase Schema

**Step 1.1: Add Missing Columns**

Run these SQL migrations in Supabase:

```sql
-- Add missing columns to applications table
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS license_number TEXT,
  ADD COLUMN IF NOT EXISTS license_state TEXT,
  ADD COLUMN IF NOT EXISTS license_expiration DATE,
  ADD COLUMN IF NOT EXISTS license_types JSONB,
  ADD COLUMN IF NOT EXISTS selected_permits JSONB,
  ADD COLUMN IF NOT EXISTS drive_abroad TEXT,
  ADD COLUMN IF NOT EXISTS departure_date DATE,
  ADD COLUMN IF NOT EXISTS permit_effective_date DATE,
  ADD COLUMN IF NOT EXISTS shipping_category TEXT,
  ADD COLUMN IF NOT EXISTS processing_option TEXT,
  ADD COLUMN IF NOT EXISTS shipping_label_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS ship_by_date DATE;
```

**Step 1.2: Verify Existing Columns**

Ensure these columns exist (they should based on schema docs):
- `first_name`, `last_name`, `email`, `phone`, `date_of_birth`
- `street_address`, `street_address_2`, `city`, `state`, `zip_code`
- `birthplace_city`, `birthplace_state`
- `amount_paid`

### Phase 2: Update `save-application.js`

**Step 2.1: Extract and Save Denormalized Fields**

Modify the `.insert()` call in `save-application.js` to include all denormalized fields:

```javascript
const { data, error } = await supabase
  .from('applications')
  .insert({
    // Existing fields
    application_id: applicationId,
    form_data: cleanFormData,
    file_urls: fileMetadata,
    payment_status: 'pending',
    fulfillment_type: fulfillmentType,
    international_full_address: formData.internationalFullAddress || null,
    international_local_address: formData.internationalLocalAddress || null,
    international_delivery_instructions: formData.internationalDeliveryInstructions || null,
    shipping_country: normalizedShippingCountry,
    pccc_code: formData.pcccCode || null,
    
    // NEW: Personal information (denormalized)
    first_name: formData.firstName,
    middle_name: formData.middleName || null,
    last_name: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    date_of_birth: formData.dateOfBirth || null, // YYYY-MM-DD format
    
    // NEW: License information (denormalized)
    license_number: formData.licenseNumber,
    license_state: formData.licenseState,
    license_expiration: formData.licenseExpiration || null,
    license_types: formData.licenseTypes || [], // Array: ['passenger', 'motorcycle', etc.]
    
    // NEW: Address information (denormalized)
    street_address: formData.streetAddress,
    street_address_2: formData.streetAddress2 || null,
    city: formData.city,
    state: formData.state,
    zip_code: formData.zipCode,
    
    // NEW: Birthplace (denormalized)
    birthplace_city: formData.birthplaceCity,
    birthplace_state: formData.birthplaceState,
    
    // NEW: Travel information (denormalized)
    drive_abroad: formData.driveAbroad,
    departure_date: formData.departureDate || null, // YYYY-MM-DD format
    permit_effective_date: formData.permitEffectiveDate || null, // YYYY-MM-DD format
    selected_permits: formData.selectedPermits || [], // Array: ['idp', 'iadp']
    
    // NEW: Shipping and processing (denormalized)
    shipping_category: formData.shippingCategory, // 'domestic', 'international', 'military'
    processing_option: formData.processingOption, // 'standard', 'fast', 'fastest'
    shipping_label_generated: fulfillmentType === 'automated', // true if automated
  })
  .select()
```

**Step 2.2: Calculate Ship-By Date**

Add a helper function to calculate `ship_by_date` based on processing option:

```javascript
function calculateShipByDate(processingOption, submittedDate = new Date()) {
  const date = new Date(submittedDate)
  let daysToAdd = 5 // Default: standard processing
  
  switch (processingOption) {
    case 'fastest':
      daysToAdd = 1 // Same-day/next-day
      break
    case 'fast':
      daysToAdd = 2 // 1-2 business days
      break
    case 'standard':
    default:
      daysToAdd = 5 // 3-5 business days
      break
  }
  
  // Add business days (skip weekends)
  let addedDays = 0
  while (addedDays < daysToAdd) {
    date.setDate(date.getDate() + 1)
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      addedDays++
    }
  }
  
  return date.toISOString().split('T')[0] // Return YYYY-MM-DD
}
```

Then add to insert:
```javascript
ship_by_date: calculateShipByDate(formData.processingOption),
```

### Phase 3: Update `webhook.js`

**Step 3.1: Update Payment Information**

Ensure `amount_paid` is set when payment completes:

```javascript
.update({
  payment_status: 'completed',
  stripe_payment_intent_id: paymentIntent.id,
  stripe_payment_method_id: paymentIntent.payment_method,
  payment_completed_at: new Date().toISOString(),
  amount_paid: paymentIntent.amount / 100, // Convert cents to dollars
  billing_address: JSON.stringify(addressData.billing_address),
  billing_name: addressData.billing_name,
  billing_email: addressData.billing_email,
  billing_phone: addressData.billing_phone,
  shipping_address: JSON.stringify(addressData.shipping_address),
  shipping_name: addressData.shipping_name,
  shipping_phone: addressData.shipping_phone,
  updated_at: new Date().toISOString()
})
```

**Step 3.2: Update Tracking Number (When Available)**

When EasyPost tracking number is available (from Make.com or EasyPost webhook), update:

```javascript
// This would be called when tracking number is received
await supabase
  .from('applications')
  .update({
    tracking_number: trackingNumber,
    updated_at: new Date().toISOString()
  })
  .eq('application_id', applicationId)
```

### Phase 4: Data Migration (If Needed)

**Step 4.1: Backfill Existing Records**

If there are existing records, create a migration script to backfill denormalized fields from `form_data`:

```sql
-- Backfill denormalized fields from form_data JSONB
UPDATE applications
SET
  first_name = form_data->>'firstName',
  middle_name = form_data->>'middleName',
  last_name = form_data->>'lastName',
  email = form_data->>'email',
  phone = form_data->>'phone',
  date_of_birth = (form_data->>'dateOfBirth')::DATE,
  license_number = form_data->>'licenseNumber',
  license_state = form_data->>'licenseState',
  license_expiration = (form_data->>'licenseExpiration')::DATE,
  license_types = form_data->'licenseTypes',
  street_address = form_data->>'streetAddress',
  street_address_2 = form_data->>'streetAddress2',
  city = form_data->>'city',
  state = form_data->>'state',
  zip_code = form_data->>'zipCode',
  birthplace_city = form_data->>'birthplaceCity',
  birthplace_state = form_data->>'birthplaceState',
  drive_abroad = form_data->>'driveAbroad',
  departure_date = (form_data->>'departureDate')::DATE,
  permit_effective_date = (form_data->>'permitEffectiveDate')::DATE,
  selected_permits = form_data->'selectedPermits',
  shipping_category = form_data->>'shippingCategory',
  processing_option = form_data->>'processingOption',
  shipping_label_generated = (fulfillment_type = 'automated')
WHERE form_data IS NOT NULL;
```

---

## Column Mapping: Google Sheets → Supabase

| Google Sheet Column | Supabase Column | Notes |
|---------------------|----------------|-------|
| Application # | `application_id` | ✅ Already saved |
| Date and time submitted | `created_at` | ✅ Auto-generated |
| Email address | `email` | ⚠️ Need to add to save-application.js |
| Phone number | `phone` | ⚠️ Need to add to save-application.js |
| First name | `first_name` | ⚠️ Need to add to save-application.js |
| Middle name | `middle_name` | ⚠️ Need to add column + save |
| Last name | `last_name` | ⚠️ Need to add to save-application.js |
| Date of birth | `date_of_birth` | ⚠️ Need to add to save-application.js |
| Driver's License Number | `license_number` | ⚠️ Need to add column + save |
| State of Issue | `license_state` | ⚠️ Need to add column + save |
| License Expiration Date | `license_expiration` | ⚠️ Need to add column + save |
| Street Address (License) | `street_address` | ⚠️ Need to add to save-application.js |
| Street Address 2 | `street_address_2` | ⚠️ Need to add to save-application.js |
| City (License) | `city` | ⚠️ Need to add to save-application.js |
| State (License) | `state` | ⚠️ Need to add to save-application.js |
| Zip Code (License) | `zip_code` | ⚠️ Need to add to save-application.js |
| Passenger Car Endorsement? | `license_types` (JSONB) | Check if contains 'passenger' |
| Motorcycle Endorsement? | `license_types` (JSONB) | Check if contains 'motorcycle' |
| Commercial/Other Endorsement? | `license_types` (JSONB) | Check if contains 'commercial' or 'other' |
| Brithplace City | `birthplace_city` | ⚠️ Need to add to save-application.js |
| Brithplace State/Country | `birthplace_state` | ⚠️ Need to add to save-application.js |
| Where will you drive abroad | `drive_abroad` | ⚠️ Need to add column + save |
| Departure date from USA | `departure_date` | ⚠️ Need to add column + save |
| Permit Effective Date | `permit_effective_date` | ⚠️ Need to add column + save |
| Getting an IDP (Y/N) | `selected_permits` (JSONB) | Check if contains 'idp' |
| Getting an IADP (Y/N) | `selected_permits` (JSONB) | Check if contains 'iadp' |
| Shipping info fields | `shipping_address` (JSONB) + `shipping_name`, `shipping_phone` | ✅ Saved in webhook.js |
| Delivery location type | `shipping_category` | ⚠️ Need to add column + save |
| Delivery speed | `processing_option` | ⚠️ Need to add column + save |
| Transaction value ($) | `amount_paid` | ⚠️ Need to add to webhook.js |
| Shipping label autogenerated | `shipping_label_generated` | ⚠️ Need to add column + save |
| Automatic Tracking No. | `tracking_number` | ⚠️ Need to add column (updated later) |
| Ship by date | `ship_by_date` | ⚠️ Need to add column + calculate |

---

## Testing Checklist

After implementation:

- [ ] Verify all columns exist in Supabase
- [ ] Test new application submission - check all fields are saved
- [ ] Test payment completion - check amount_paid is set
- [ ] Verify date fields are in correct format (YYYY-MM-DD)
- [ ] Verify JSONB arrays (license_types, selected_permits) are saved correctly
- [ ] Verify ship_by_date is calculated correctly
- [ ] Check Supabase table view shows all data correctly
- [ ] Test with international shipping - verify all fields populate
- [ ] Test with domestic shipping - verify all fields populate
- [ ] Test with military shipping - verify all fields populate
- [ ] Verify existing records can be queried with new columns
- [ ] Run backfill migration if needed for existing records

---

## Benefits of This Approach

1. **Single Source of Truth:** Supabase becomes the complete database
2. **Easy Querying:** All fields are denormalized, no need to parse JSONB
3. **Better Performance:** Indexed columns for fast searches
4. **Client-Friendly:** Can view all data directly in Supabase dashboard
5. **Future-Proof:** Easy to export to CSV, connect to BI tools, etc.
6. **No Dependencies:** No need for Google Sheets or Make.com for data storage

---

## Next Steps

1. **Review this plan** - Confirm all requirements are captured
2. **Create SQL migration** - Add missing columns
3. **Update save-application.js** - Add all denormalized fields
4. **Update webhook.js** - Ensure amount_paid is set
5. **Test thoroughly** - Verify all data saves correctly
6. **Backfill if needed** - Migrate existing records
7. **Document for client** - Show them how to access Supabase dashboard

---

**Status:** Ready for Implementation  
**Estimated Time:** 2-3 hours for implementation + testing  
**Risk Level:** Low (adding columns, not modifying existing structure)

