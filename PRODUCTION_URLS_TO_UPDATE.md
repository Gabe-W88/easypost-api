# Production URLs to Update

## Files That Need URL Updates

### 1. `apply.jsx` - Frontend API Calls

**Line 1763, 1970:** Address validation
```javascript
// CHANGE FROM:
"https://easypost-api.vercel.app/api/validate-address"
// TO:
"https://[CLIENT-VERCEL-URL]/api/validate-address"
```

**Line 2608:** Save application
```javascript
// CHANGE FROM:
"https://easypost-api.vercel.app/api/save-application"
// TO:
"https://[CLIENT-VERCEL-URL]/api/save-application"
```

**Line 2632:** Create payment intent
```javascript
// CHANGE FROM:
"https://easypost-api.vercel.app/api/create-payment-intent"
// TO:
"https://[CLIENT-VERCEL-URL]/api/create-payment-intent"
```

**Line 2655:** Create checkout
```javascript
// CHANGE FROM:
"https://easypost-api.vercel.app/api/create-checkout"
// TO:
"https://[CLIENT-VERCEL-URL]/api/create-checkout"
```

**Line 3500:** Terms link
```javascript
// CHANGE FROM:
href="https://serious-flows-972417.framer.app/terms"
// TO:
href="https://[CLIENT-FRAMER-URL]/terms"
```

---

### 2. API Files - CORS Origins

**Files to update:** `api/save-application.js`, `api/webhook.js`, `api/create-payment-intent.js`, `api/validate-address.js`

**Find and replace:**
```javascript
// CHANGE FROM:
'https://serious-flows-972417.framer.app'
// TO:
'https://[CLIENT-FRAMER-URL]'
```

**Specific locations:**
- `api/save-application.js`: Lines 360, 369, 638, 646
- `api/webhook.js`: Lines 552, 565, 639
- `api/create-payment-intent.js`: Line 7
- `api/validate-address.js`: Lines 41, 140

---

### 3. Make.com Webhook URL

**File:** `api/webhook.js` Line 1469

```javascript
// CHANGE FROM:
const makeWebhookUrl = 'https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b'
// TO:
const makeWebhookUrl = 'https://hook.us2.make.com/[CLIENT-MAKE-WEBHOOK-ID]'
```

**Note:** Client needs to create their own Make.com webhook and provide the URL.

---

### 4. Make.com Update Shipping Endpoint

**In Make.com HTTP module:**
- URL: `https://[CLIENT-VERCEL-URL]/api/update-shipping`

---

## Environment Variables Client Needs

### Vercel Environment Variables:

```
SUPABASE_URL=https://[client-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[client-service-role-key]
SUPABASE_ANON_KEY=[client-anon-key] (if needed)

STRIPE_SECRET_KEY=sk_live_[client-live-key]
STRIPE_PUBLISHABLE_KEY=pk_live_[client-live-key]
STRIPE_WEBHOOK_SECRET=whsec_[client-webhook-secret]

EASYPOST_API_KEY=[client-easypost-key]

# Optional business info (or hardcode defaults)
BUSINESS_STREET_ADDRESS=[client-address]
BUSINESS_CITY=[client-city]
BUSINESS_STATE=[client-state]
BUSINESS_ZIP=[client-zip]
BUSINESS_PHONE=[client-phone]
BUSINESS_EMAIL=[client-email]
```

---

## Quick Find/Replace Commands

### For Vercel URL:
```bash
# Find all instances
grep -r "easypost-api.vercel.app" .

# Replace (after getting client's URL)
find . -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/easypost-api\.vercel\.app/[CLIENT-VERCEL-URL]/g'
```

### For Framer URL:
```bash
# Find all instances
grep -r "serious-flows-972417.framer.app" .

# Replace
find . -type f -name "*.js" -o -name "*.jsx" | xargs sed -i '' 's/serious-flows-972417\.framer\.app/[CLIENT-FRAMER-URL]/g'
```

---

## Testing After Updates

1. Test form submission
2. Test payment processing
3. Test webhook triggers
4. Check CORS errors in browser console
5. Verify Make.com receives webhooks

