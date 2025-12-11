# Debug: No Row Created in Supabase

## Issue
Form submission doesn't create a row in the `applications` table.

## Step-by-Step Debugging

### Step 1: Check if API is Being Called

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Submit the form
4. Look for a request to `save-application`
5. **What to check:**
   - Is the request being made? (Should see `save-application` in the list)
   - What's the status code? (200 = success, 4xx/5xx = error)
   - What's the response body? (Click on the request → Response tab)

### Step 2: Check Browser Console

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Submit the form
4. **Look for:**
   - Red error messages
   - "Save application failed" messages
   - Any CORS errors
   - Any network errors

### Step 3: Check Vercel Function Logs

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Functions** tab
4. Click on `api/save-application.js`
5. Check the **Logs** tab
6. **Look for:**
   - `=== DATABASE INSERT DEBUG ===`
   - `Database insert result:`
   - Any error messages
   - Database error details

### Step 4: Check if Code is Deployed

1. Go to Vercel dashboard
2. Check **Deployments** tab
3. **Verify:**
   - Is there a recent deployment? (Should show latest commit)
   - Is it "Ready" or still "Building"?
   - If no recent deployment, the old code is still running

### Step 5: Test API Directly

Run this in your browser console (on your form page):

```javascript
fetch('https://easypost-api.vercel.app/api/save-application', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    applicationId: 'TEST-' + Date.now(),
    formData: {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '1234567890',
      // Add other required fields...
    },
    fileData: {}
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

**What to check:**
- Does it return an error?
- What's the error message?

## Common Issues

### Issue 1: Code Not Deployed
**Symptom:** Old code still running, new columns don't exist in old code

**Fix:**
1. Make sure code is pushed to git
2. Check Vercel auto-deployed
3. If not, manually trigger deployment in Vercel

### Issue 2: Database Column Missing
**Symptom:** Error like "column X does not exist"

**Fix:**
1. Run the migration SQL again
2. Verify all columns exist

### Issue 3: CORS Error
**Symptom:** Browser console shows CORS error

**Fix:**
- Check `save-application.js` CORS configuration
- Make sure your domain is in allowed origins

### Issue 4: Validation Error
**Symptom:** API returns 400/422 error

**Fix:**
- Check what validation is failing
- Look at the error message in response

## What to Share

Please share:
1. **Browser Console errors** (screenshot or copy/paste)
2. **Network tab response** (the `save-application` request response)
3. **Vercel function logs** (from the Functions tab)
4. **Any error messages** you see

This will help me identify the exact issue!

