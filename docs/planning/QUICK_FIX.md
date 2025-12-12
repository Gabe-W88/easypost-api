# Quick Fix: Form Submission Not Creating Rows

## The Problem
Console shows "Application saved" but no row appears in Supabase.

## The Solution

### Step 1: Check Vercel Function Logs
1. Go to Vercel dashboard → Your project → Functions → `api/save-application.js`
2. Click "Logs" tab
3. Look for `Database insert result:` 
4. **What does it show?**
   - If `error: null` → Insert succeeded, check if you're looking at the right table
   - If `error: {...}` → Copy the error message

### Step 2: Check Browser Network Tab
1. Open DevTools (F12) → Network tab
2. Find the `save-application` request
3. Click it → Response tab
4. **What does it say?**
   - If it shows `{ success: true }` → API worked, check database
   - If it shows an error → Copy the error message

### Step 3: Check Supabase Logs
1. Go to Supabase → Logs → Postgres Logs
2. Look for errors around the time you submitted the form
3. **Any errors?** Copy them

## Most Likely Issue

The insert is probably failing due to:
1. **Missing required column** - Check if all columns in the insert exist
2. **Data type mismatch** - Check if dates/numbers are in correct format
3. **Constraint violation** - Check if `application_id` already exists

## Quick Test

Run this in Supabase SQL Editor to see if the row exists:

```sql
SELECT * FROM applications 
WHERE application_id = 'APP-1765495852406-419l8umuq';
```

If it returns a row → It's there, you might be looking at a view instead of the table.

If it returns nothing → The insert failed, check Vercel logs for the error.

---

**Share the Vercel function logs and I'll tell you exactly what's wrong.**

