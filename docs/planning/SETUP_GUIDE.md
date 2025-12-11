# Supabase Setup - Simple Steps

## What We're Doing
Set up Supabase so every form submission saves all data to individual columns (not just JSONB).

---

## Step 1: Run SQL in Supabase (5 minutes)

1. Go to https://app.supabase.com → Your Project → SQL Editor
2. Open `supabase_clean_setup.sql` from your project
3. Copy the entire file
4. Paste into Supabase SQL Editor
5. **DO NOT uncomment the DROP TABLE line** (keep it as `-- DROP TABLE...`)
6. Click "Run"

**Done.** Your table now has all required columns.

---

## Step 2: Verify It Worked

Run this in Supabase SQL Editor:

```sql
SELECT COUNT(*) FROM applications;
```

If it returns a number (even 0), the table exists. ✅

---

## Step 3: Test Form Submission

1. Submit a test application through your form
2. Go to Supabase → Table Editor → `applications` table
3. Check if a new row appears with data

**If a row appears:** ✅ Everything works!

**If no row appears:** Check Vercel deployment (see Step 4)

---

## Step 4: Make Sure Code is Deployed

1. Go to https://vercel.com/dashboard
2. Find your project
3. Check if there's a recent deployment
4. If not, wait 1-2 minutes for auto-deploy, or manually trigger it

---

## That's It

Your Supabase is now set up. Every form submission will automatically save all data to the columns.

**Need help?** Check the browser console (F12) for errors when submitting the form.

