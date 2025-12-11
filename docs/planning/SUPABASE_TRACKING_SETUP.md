# Supabase Tracking Setup Guide

**Goal:** Make Supabase the single source of truth for tracking all applications, eliminating the need for Google Sheets.

---

## Current Problem

**What's Working:**
- ✅ All form data is saved to `form_data` JSONB field
- ✅ Payment status, fulfillment type, and shipping info are saved
- ✅ Files are stored in Supabase Storage with URLs

**What's Missing:**
- ❌ Denormalized columns (first_name, last_name, email, phone, etc.) are NOT being populated
- ❌ Makes it hard to view/search applications in Supabase dashboard
- ❌ Can't easily filter or sort by customer name, email, etc.

---

## Solution: Populate Denormalized Columns

### Step 1: Update `save-application.js` to Populate Denormalized Fields

When saving an application, extract key fields from `form_data` and populate the denormalized columns:

**Fields to Populate:**
- `first_name` - from `formData.firstName`
- `middle_name` - from `formData.middleName` (optional)
- `last_name` - from `formData.lastName`
- `email` - from `formData.email`
- `phone` - from `formData.phone`
- `date_of_birth` - from `formData.dateOfBirth` (convert to DATE format)
- `birthplace_city` - from `formData.birthplaceCity`
- `birthplace_state` - from `formData.birthplaceState`
- `street_address` - from `formData.streetAddress`
- `street_address_2` - from `formData.streetAddress2`
- `city` - from `formData.city`
- `state` - from `formData.state`
- `zip_code` - from `formData.zipCode`

**Additional Fields to Consider:**
- `license_number` - from `formData.licenseNumber`
- `license_state` - from `formData.licenseState`
- `license_expiration` - from `formData.licenseExpiration`
- `shipping_category` - from `formData.shippingCategory` (domestic/international/military)
- `processing_option` - from `formData.processingOption` (standard/fast/fastest)
- `selected_permits` - from `formData.selectedPermits` (array, could store as JSONB or comma-separated)

### Step 2: Update `webhook.js` if Needed

The webhook already updates payment-related fields. We may want to ensure denormalized fields are also updated if form data changes (though this is unlikely after payment).

---

## Recommended Supabase Table Structure

### Essential Columns for Tracking

| Column | Type | Purpose | Source |
|--------|------|---------|--------|
| `application_id` | VARCHAR | Unique ID | Generated |
| `created_at` | TIMESTAMP | Submission date | Auto |
| `first_name` | VARCHAR | Customer name | formData.firstName |
| `last_name` | VARCHAR | Customer name | formData.lastName |
| `email` | VARCHAR | Contact | formData.email |
| `phone` | VARCHAR | Contact | formData.phone |
| `payment_status` | VARCHAR | Status | pending/completed/failed |
| `fulfillment_type` | VARCHAR | Automation | automated/manual |
| `shipping_category` | VARCHAR | Type | domestic/international/military |
| `processing_option` | VARCHAR | Speed | standard/fast/fastest |
| `amount_paid` | DECIMAL | Revenue | From Stripe |
| `payment_completed_at` | TIMESTAMP | Paid date | From webhook |
| `make_automation_status` | VARCHAR | Workflow | processing/completed/failed |

### Optional but Helpful Columns

| Column | Type | Purpose |
|--------|------|---------|
| `date_of_birth` | DATE | Customer DOB |
| `license_number` | VARCHAR | License info |
| `license_state` | VARCHAR | License state |
| `shipping_country` | VARCHAR(2) | Shipping destination |
| `city` | VARCHAR | Customer city |
| `state` | VARCHAR | Customer state |

---

## How Client Will Use Supabase

### Option 1: Supabase Dashboard (Easiest)

1. **Access:** Go to Supabase dashboard → Table Editor → `applications` table
2. **View Data:** See all applications in a table view
3. **Filter:** Use column filters to find specific applications
4. **Search:** Use search bar to find by name, email, application_id
5. **Sort:** Click column headers to sort
6. **Export:** Click "Export" to download as CSV

**Pros:**
- No setup required
- Real-time data
- Built-in filtering/searching
- Can export to CSV when needed

**Cons:**
- Less familiar than spreadsheets
- Can't do complex formulas
- Limited collaboration features

### Option 2: Supabase SQL Editor (Advanced)

Create custom views or queries:

```sql
-- View all completed applications
SELECT 
  application_id,
  first_name,
  last_name,
  email,
  payment_status,
  amount_paid,
  created_at
FROM applications
WHERE payment_status = 'completed'
ORDER BY created_at DESC;

-- View by shipping category
SELECT 
  shipping_category,
  COUNT(*) as count,
  SUM(amount_paid) as total_revenue
FROM applications
WHERE payment_status = 'completed'
GROUP BY shipping_category;
```

### Option 3: Build Simple Admin View (Future)

Create a simple React page that queries Supabase and displays applications in a table format. This would give a spreadsheet-like experience while using Supabase as the backend.

---

## Implementation Steps

### Phase 1: Populate Denormalized Fields (Priority)

1. **Update `api/save-application.js`:**
   - Extract fields from `formData` before insert
   - Populate all denormalized columns in the `.insert()` call
   - Test with a new application submission

2. **Verify in Supabase:**
   - Check that columns are populated
   - Verify data matches `form_data` JSONB

### Phase 2: Add Missing Columns (If Needed)

1. **Check if these columns exist:**
   - `shipping_category`
   - `processing_option`
   - `license_number`
   - `license_state`
   - `license_expiration`

2. **If missing, add via Supabase dashboard:**
   - Go to Table Editor → `applications` table
   - Click "Add Column"
   - Add each column with appropriate type

### Phase 3: Create Tracking View (Optional)

1. **Create a SQL view** with most important columns:
   ```sql
   CREATE VIEW applications_tracking AS
   SELECT 
     application_id,
     created_at,
     first_name,
     last_name,
     email,
     phone,
     payment_status,
     fulfillment_type,
     shipping_category,
     processing_option,
     amount_paid,
     payment_completed_at,
     make_automation_status
   FROM applications;
   ```

2. **Use this view** in Supabase dashboard for cleaner viewing

### Phase 4: Documentation for Client

1. **Create user guide** for accessing Supabase
2. **Screenshot walkthrough** of dashboard
3. **Common queries** for filtering/searching
4. **Export instructions** for CSV downloads

---

## Benefits of This Approach

✅ **Single Source of Truth:** All data in one place  
✅ **Real-time:** No sync delays  
✅ **Reliable:** No dependency on Make.com for data storage  
✅ **Queryable:** Can write custom SQL queries  
✅ **Scalable:** Handles any volume of applications  
✅ **Secure:** Supabase handles access control  
✅ **Exportable:** Can export to CSV/Excel when needed  

---

## Migration from Google Sheets (If Needed)

If you already have data in Google Sheets:

1. **Export Google Sheets** to CSV
2. **Map columns** to Supabase columns
3. **Import via Supabase dashboard** or SQL script
4. **Verify data** matches

---

## Next Steps

1. ✅ **Update `save-application.js`** to populate denormalized fields
2. ✅ **Test with new application** submission
3. ✅ **Verify in Supabase** dashboard
4. ✅ **Create client documentation** for using Supabase
5. ⏭️ **Optional:** Create SQL view for easier tracking
6. ⏭️ **Optional:** Build simple admin view (future)

---

**Status:** Ready for implementation  
**Priority:** High - Makes Supabase fully functional for tracking

