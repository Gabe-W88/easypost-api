# Clean Supabase Setup Guide

**Purpose:** Start fresh with a clean Supabase setup for the applications table.

**Time Required:** 5 minutes

---

## Option 1: Keep Existing Data (Recommended)

If you have existing applications you want to keep:

1. **Backup first** (optional but recommended):
   ```sql
   -- Export existing data
   SELECT * FROM applications;
   -- Copy the results or export to CSV
   ```

2. **Run the clean setup SQL:**
   - Open Supabase SQL Editor
   - Copy and paste the entire `supabase_clean_setup.sql` file
   - **IMPORTANT:** Do NOT uncomment the `DROP TABLE` line
   - Click "Run"
   - This will create the table if it doesn't exist, or add missing columns if it does

3. **Backfill existing records** (if you have any):
   - Use the backfill query from `supabase_migration.sql` (STEP 3)
   - This will populate the new columns from existing `form_data` JSONB

---

## Option 2: Start Completely Fresh (Delete Everything)

**WARNING: This will delete all existing data!**

1. **Backup first** (if you want to keep any data):
   ```sql
   -- Export existing data
   SELECT * FROM applications;
   ```

2. **Run the clean setup SQL:**
   - Open Supabase SQL Editor
   - Copy and paste `supabase_clean_setup.sql`
   - **Uncomment the DROP TABLE line** (remove the `--` at the beginning)
   - Click "Run"
   - This will delete the old table and create a fresh one

---

## What This Creates

### Complete Table Structure:
- ✅ All required columns for CSV export
- ✅ Denormalized fields for easy querying
- ✅ JSONB fields for full data storage
- ✅ Indexes for performance
- ✅ Auto-updating `updated_at` timestamp

### Columns Included:
- Personal info (first_name, last_name, email, phone, etc.)
- License info (license_number, license_state, etc.)
- Address info (street_address, city, state, zip_code)
- Travel info (drive_abroad, departure_date, etc.)
- Shipping info (all individual columns)
- Payment info (amount_paid, payment_status, etc.)
- Automation info (fulfillment_type, tracking_number, etc.)

---

## After Running the Setup

1. **Verify the table:**
   ```sql
   SELECT COUNT(*) FROM applications;
   -- Should return 0 if fresh start, or your existing count
   ```

2. **Test a form submission:**
   - Submit a test application
   - Check if a row is created
   - Verify all columns are populated

3. **Check the data:**
   ```sql
   SELECT 
     application_id,
     first_name,
     last_name,
     email,
     shipping_category,
     processing_option
   FROM applications
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## Troubleshooting

### Error: "relation already exists"
- The table already exists
- Use Option 1 (keep existing data) instead
- Or drop it first if you want to start fresh

### Error: "column already exists"
- Some columns already exist
- The script uses `IF NOT EXISTS` so this is safe
- Just continue - it will only add missing columns

### Error: "permission denied"
- Make sure you're logged in as project owner
- Or use the service role key

---

## Next Steps

After the clean setup:

1. ✅ **Test form submission** - Submit a test application
2. ✅ **Verify data** - Check that all columns are populated
3. ✅ **Check Vercel deployment** - Make sure latest code is deployed
4. ✅ **View in Supabase** - Use Table Editor to see the data

---

**Status:** Ready to run  
**Risk Level:** Low (uses IF NOT EXISTS, safe to run multiple times)

