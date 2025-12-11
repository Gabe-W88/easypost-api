# Troubleshooting Form Submission Not Saving to Supabase

## Quick Checks

### 1. Check if Code is Deployed
The form calls: `https://easypost-api.vercel.app/api/save-application`

**Action:** Make sure your latest code changes are deployed to Vercel:
- Go to Vercel dashboard
- Check if there's a recent deployment
- If not, push to git and Vercel should auto-deploy

### 2. Check Browser Console
When you submit the form, check the browser console (F12) for errors:
- Look for any red error messages
- Check the Network tab to see if the API call is being made
- Check if the API call returns an error

### 3. Check Vercel Function Logs
- Go to Vercel dashboard → Your project → Functions
- Look for `save-application` function logs
- Check for any error messages

### 4. Check Supabase Logs
- Go to Supabase dashboard → Logs → Postgres Logs
- Look for any database errors when the form is submitted

## Common Issues

### Issue 1: Code Not Deployed
**Symptom:** Form submits but nothing happens in Supabase

**Solution:**
1. Make sure you've pushed to git: `git push origin main`
2. Check Vercel dashboard for deployment status
3. Wait for deployment to complete (usually 1-2 minutes)

### Issue 2: Database Error
**Symptom:** API call succeeds but database insert fails

**Check:**
- Run this query in Supabase SQL Editor to see recent errors:
```sql
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%applications%' 
ORDER BY calls DESC 
LIMIT 10;
```

### Issue 3: Missing Columns
**Symptom:** Database insert fails with "column does not exist" error

**Solution:**
- Make sure you ran the migration SQL (from `supabase_migration.sql`)
- Verify all columns exist using the verification query

### Issue 4: API Not Being Called
**Symptom:** No network request to `/api/save-application` in browser console

**Check:**
- Open browser DevTools → Network tab
- Submit the form
- Look for a request to `save-application`
- If it's not there, there's a frontend issue

## Debug Steps

### Step 1: Verify API is Being Called
1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit the form
4. Look for `save-application` request
5. Check the response status and body

### Step 2: Check API Response
If the API is being called, check:
- **Status Code:** Should be 200
- **Response Body:** Should contain `{ success: true, applicationId: "..." }`
- **Error Message:** If status is not 200, check the error message

### Step 3: Check Database
1. Go to Supabase → Table Editor → `applications`
2. Check if a new row was created (even if columns are empty)
3. If no row was created, the insert failed
4. If a row was created but columns are empty, the data mapping is wrong

### Step 4: Check Function Logs
1. Go to Vercel → Your Project → Functions → `save-application`
2. Check the logs for:
   - `=== DATABASE INSERT DEBUG ===`
   - `Database insert result:`
   - Any error messages

## Test Query

Run this in Supabase SQL Editor to check if data is being saved:

```sql
-- Check the most recent application
SELECT 
  application_id,
  created_at,
  first_name,
  last_name,
  email,
  shipping_category,
  processing_option
FROM applications
ORDER BY created_at DESC
LIMIT 5;
```

If you see rows but `first_name`, `last_name`, etc. are NULL, the denormalized fields aren't being saved (code issue).

If you see no rows, the insert is failing (database or API issue).

## Next Steps

1. **Check deployment status** - Make sure code is deployed
2. **Check browser console** - Look for errors
3. **Check Vercel logs** - Look for API errors
4. **Check Supabase logs** - Look for database errors
5. **Run test query** - See if any data is being saved

Let me know what you find and I can help fix the specific issue!

