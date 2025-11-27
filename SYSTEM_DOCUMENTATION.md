# Fast IDP - Complete System Documentation
**Last Updated:** November 26, 2025  
**Purpose:** Single source of truth for the entire system architecture, data flow, and configuration

---

## 🚨 CRITICAL RULES - READ FIRST

### When Making Changes:
1. **NEVER** modify code without understanding the complete data flow
2. **ALWAYS** check if pricing, IDs, or URLs are hardcoded in multiple places
3. **NEVER** create duplicate files or directories without explicit instruction
4. **ALWAYS** clean up after yourself - commit deletions of unused code
5. **NEVER** assume frontend/backend are synced - verify applicationId flow
6. **ALWAYS** test the complete flow after changes: upload → save → payment → webhook → Make.com

### Before Claiming "It Works":
1. Test file uploads to Supabase
2. Verify application saves to database with correct ID
3. Confirm payment intent has applicationId in metadata
4. Check webhook finds the application by applicationId
5. Verify Make.com receives the payload

---

## 📁 PROJECT STRUCTURE

```
FastIDP/
├── api/                          # Vercel serverless functions
│   ├── save-application.js       # Saves form data & file metadata to DB
│   ├── create-payment-intent.js  # Creates Stripe embedded payment
│   ├── webhook.js                # Handles Stripe events & triggers Make.com
│   └── validate-address.js       # EasyPost address validation
├── config/
│   └── pricing.js                # ⭐ SINGLE SOURCE OF TRUTH for all pricing
├── apply.jsx                     # Main frontend form (copied to Framer)
├── protectyourself.jsx           # Separate page component
├── Pricing_Timeline_Calculator.jsx # Calculator component (uses pricing data)
├── .env.example                  # Template for environment variables
├── PROTOCOL.md                   # Workflow rules for AI assistance
├── SYSTEM_DOCUMENTATION.md       # This file
└── package.json                  # Dependencies (Stripe, Supabase, EasyPost)
```

### ⚠️ DELETED/UNUSED FILES:
- `easypost-api/` - Duplicate directory (deleted Nov 26, 2025)
- `api/create-checkout.js` - Old redirect checkout (deleted Nov 26, 2025)

---

## 🔄 COMPLETE DATA FLOW

### 1. Form Submission (Frontend - apply.jsx)

**Location:** Lines 2610-2750

```javascript
// Step 1: Generate applicationId (CRITICAL - must be unique)
const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Step 2: Upload files DIRECTLY to Supabase Storage
// Returns: [{name, type, size, path, publicUrl}, ...]
const driversLicenseUploads = await uploadFileToSupabase(files)
const passportPhotoUploads = await uploadFileToSupabase(files)

// Step 3: Send to backend with PRE-UPLOADED file URLs
await fetch('/api/save-application', {
  body: JSON.stringify({
    applicationId,        // Frontend-generated ID
    formData,            // Form fields
    fileData: {          // Pre-uploaded file metadata (NOT base64)
      driversLicense: [{publicUrl, path, name, type, size}, ...],
      passportPhoto: [{publicUrl, path, name, type, size}, ...]
    }
  })
})

// Step 4: Create payment intent with SAME applicationId
await fetch('/api/create-payment-intent', {
  body: JSON.stringify({ applicationId, formData })
})

// Step 5: Stripe embedded payment (NO manual webhook trigger)
// Stripe automatically calls webhook when payment succeeds
```

**Key State Variables:**
- `paymentState.applicationId` - Must match backend saved ID
- `uploadedFiles` - File objects before upload
- `step` - Current form step (1-4)

---

### 2. Backend Save (api/save-application.js)

**Purpose:** Save application to database with file metadata

**CRITICAL:** Backend MUST use the applicationId from request body (line 317), NOT generate a new one.

```javascript
// Line 317: Extract applicationId from request
const { applicationId, formData, fileData } = req.body

// Lines 373-397: Process files
// - If file has publicUrl & path: Use it (already uploaded from frontend)
// - If file has data: Upload base64 (signature only)
await uploadFilesToStorage(fileData.driversLicense, applicationId, 'drivers_license')

// Line 453: Save to database with frontend's applicationId
await supabase.from('applications').insert({
  application_id: applicationId,  // ⚠️ MUST match frontend ID
  form_data: cleanFormData,
  file_urls: fileMetadata,        // URLs, not base64
  payment_status: 'pending',
  fulfillment_type: 'automated',  // or 'manual' based on country
})
```

**Returns:**
```json
{
  "success": true,
  "applicationId": "APP-1234567890-abc123",
  "data": { /* database row */ },
  "pricing": { /* calculated from config/pricing.js */ }
}
```

---

### 3. Payment Intent (api/create-payment-intent.js)

**Purpose:** Create Stripe payment with applicationId in metadata

```javascript
// Lines 244-252: CRITICAL - applicationId in metadata
const paymentIntent = await stripe.paymentIntents.create({
  amount: totalAmount,
  currency: 'usd',
  metadata: {
    applicationId: applicationId,  // ⚠️ Webhook needs this to find application
    customer_email: formData.email,
    customer_name: `${formData.firstName} ${formData.lastName}`,
  },
})
```

**Pricing Calculation:**
1. Import from `config/pricing.js`
2. Add permits: `PERMIT_PRICES.idp * count`
3. Add combined: `getCombinedPriceCents(category, speed)`
4. Add tax: `TAX.rate * subtotal`

---

### 4. Webhook Handler (api/webhook.js)

**Purpose:** Handle Stripe payment success, trigger Make.com automation

**Flow:**
```javascript
// Lines 173-197: Extract applicationId from payment intent
let paymentIntent = paymentIntentData
if (!paymentIntent.amount) {
  // Fetch full PaymentIntent from Stripe (includes metadata)
  paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentData.id, {
    expand: ['payment_method']
  })
}

const applicationId = paymentIntent.metadata?.applicationId

// Lines 239-265: Update application in database
await supabase.from('applications')
  .update({ payment_status: 'completed', ... })
  .eq('application_id', applicationId)  // ⚠️ MUST match saved ID
  .single()

// Lines 572-590: Trigger Make.com
await fetch('https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b', {
  body: JSON.stringify(automationData)  // Full application details
})
```

**⚠️ CRITICAL:** Stripe's automatic webhook calls this - frontend does NOT manually trigger it.

---

## 💰 PRICING SYSTEM

### Single Source of Truth: `config/pricing.js`

**All pricing calculations import from this file:**
- `api/save-application.js` (for display/validation)
- `api/create-payment-intent.js` (for Stripe charging)
- `Pricing_Timeline_Calculator.jsx` (for frontend calculator)

**To Update Prices:**
1. Edit `config/pricing.js` only
2. Commit and push
3. Done - all files automatically use new prices

**Current Pricing (TEST MODE):**

| Item | Price |
|------|-------|
| IDP/IAPD Permit | $20 each |

**Combined Processing + Shipping:**

| Category | Standard | Fast | Fastest |
|----------|----------|------|---------|
| Domestic (incl. Territories) | $58 | $108 | $168 |
| International | $98 | $148 | $198 |
| Military | $49 | $89 | $119 |

**Tax:** 7.75% (Bellefontaine, OH)

**Breakdown (for backend reference only):**
- Processing: $49 / $89 / $119
- Shipping varies by category (see `config/pricing.js`)

---

## 🗄️ DATABASE SCHEMA

### Supabase Table: `applications`

**Primary Key:** `id` (auto-increment)  
**Unique Key:** `application_id` (varchar, frontend-generated `APP-xxx`)

**Critical Columns:**
```sql
application_id              VARCHAR   NOT NULL  -- Frontend-generated ID
form_data                   JSONB     NOT NULL  -- All form fields
file_urls                   JSONB              -- {driversLicense: [{publicUrl, path}], ...}
payment_status              VARCHAR            DEFAULT 'pending'
stripe_payment_intent_id    VARCHAR            -- Set by webhook
payment_completed_at        TIMESTAMPTZ        -- Set by webhook
fulfillment_type            TEXT               DEFAULT 'automated'
make_automation_triggered_at TIMESTAMPTZ       -- When Make.com was called
make_automation_status      TEXT               DEFAULT 'pending'
```

**File URLs Structure (JSONB):**
```json
{
  "driversLicense": [
    {
      "originalName": "license.jpg",
      "fileName": "APP-123/driversLicense_1.jpg",
      "path": "APP-123/driversLicense_1.jpg",
      "publicUrl": "https://[supabase]/storage/v1/object/public/application-files/APP-123/driversLicense_1.jpg",
      "size": 50000,
      "type": "image/jpeg"
    }
  ],
  "passportPhoto": [/* same structure */],
  "signature": {/* same structure, single object */}
}
```

---

## 📦 FILE STORAGE

### Supabase Storage Bucket: `application-files`

**Access:** Public read, public write (RLS policies configured)

**Folder Structure:**
```
application-files/
├── APP-1732667234567-abc123/
│   ├── driversLicense_1.jpg
│   ├── driversLicense_2.jpg
│   ├── passportPhoto_1.jpg
│   └── signature_1.png
└── APP-1732667890123-xyz789/
    └── ...
```

**Upload Flow:**
1. Frontend uploads directly to Supabase (bypasses Vercel 4.5MB limit)
2. Frontend gets public URL
3. Frontend sends URL to backend
4. Backend saves URL to database (NOT base64)

**Exception:** Signature is still base64 from canvas, backend uploads it

---

## 🔐 ENVIRONMENT VARIABLES

**File:** `.env` (not in git)  
**Template:** `.env.example`

```bash
# Stripe (TEST MODE - will need LIVE keys when launching)
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
SUPABASE_URL=https://dkpsbqhzpxnziudimlex.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# EasyPost
EASYPOST_API_KEY=EZTKTEST_...
```

**NOT USED (removed from .env.example):**
- `STRIPE_PUBLISHABLE_KEY` - Frontend only (not backend)
- `MAKE_WEBHOOK_URL` - Hardcoded in webhook.js
- `NODE_ENV`, `PORT`, `BUSINESS_EMAIL`, `SMTP_*` - Not used

**Vercel Configuration:**
Set these in Vercel dashboard → Settings → Environment Variables

---

## 🌐 DOMAINS & URLS

### Current (TEST MODE):

**Frontend (Framer):**
- `https://serious-flows-972417.framer.app`
- CORS configured in all API files

**Backend (Vercel):**
- `https://easypost-api.vercel.app`
- API routes: `/api/save-application`, `/api/create-payment-intent`, `/api/webhook`

**Make.com Webhook:**
- `https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b`
- Hardcoded in `api/webhook.js` line 572 (permanent URL)

### When Switching to LIVE:

**Update These Files:**
1. **All API files:** Replace Framer URL in CORS headers
   - `api/save-application.js` lines 286, 299, 488, 501
   - `api/create-payment-intent.js` lines 31, 271
   - `api/webhook.js` lines 40, 50, 132
   
2. **apply.jsx:** Update API endpoints (if domain changes)
   - Lines 2667, 2693, etc.

3. **Environment Variables:**
   - `STRIPE_SECRET_KEY_TEST` → `STRIPE_SECRET_KEY` (live key)
   - Update webhook secret
   - Update Supabase keys if using different project

4. **config/pricing.js:** Update prices if different for live

5. **Stripe Products:** Update `STRIPE_PRODUCTS` IDs in config (if using)

---

## 🔧 KEY FUNCTIONS & THEIR PURPOSES

### Frontend (apply.jsx)

| Function | Lines | Purpose |
|----------|-------|---------|
| `MultistepForm` | 1124 | Main component, manages form state |
| `uploadFileToSupabase` | 2616-2640 | Direct upload to Supabase, returns URLs |
| `handlePaymentSuccess` | 2756-2788 | Called when payment succeeds (NO manual webhook) |
| `validateAddress` | ~3000 | EasyPost address validation |

**State Management:**
```javascript
const [formData, setFormData] = useState({
  // Step 1: Personal info
  email, firstName, lastName, phone, dateOfBirth,
  licenseNumber, licenseState, licenseExpiration,
  streetAddress, city, state, zipCode,
  
  // Step 2: Permits & travel
  selectedPermits: [],
  driveAbroad, departureDate, permitEffectiveDate,
  signature, // Base64 canvas signature
  
  // Step 3: Shipping
  processingOption: 'standard' | 'fast' | 'fastest',
  shippingCategory: 'domestic' | 'international' | 'military',
  shippingStreetAddress, shippingCity, shippingState,
  shippingCountry, // For international
  pcccCode, // For South Korea
})

const [uploadedFiles, setUploadedFiles] = useState({
  driversLicense: [File, File, ...],
  passportPhoto: [File, File, ...],
})

const [paymentState, setPaymentState] = useState({
  clientSecret: null,
  applicationId: null,  // ⚠️ MUST match backend saved ID
  paymentIntentId: null,
  isComplete: false,
})
```

---

### Backend (api/save-application.js)

| Function | Lines | Purpose |
|----------|-------|---------|
| `uploadFilesToStorage` | 47-109 | Handles both pre-uploaded URLs and base64 uploads |
| `determineFulfillmentType` | 245-280 | Returns 'automated' or 'manual' based on country |
| `calculatePricing` | 515-633 | Uses config/pricing.js to calculate total |

**Automated Countries (EasyPost):**
```javascript
['AU', 'AT', 'BE', 'CA', 'DK', 'FI', 'FR', 'DE', 'IE', 'IT', 
 'LU', 'MX', 'NL', 'NZ', 'NO', 'PT', 'ES', 'SE', 'CH', 'GB']
```

---

### Backend (api/webhook.js)

| Function | Lines | Purpose |
|----------|-------|---------|
| `handlePaymentSucceeded` | 173-280 | Main handler for payment_intent.succeeded |
| `triggerMakeAutomation` | 310-620 | Sends comprehensive data to Make.com |
| `getDeliveryEstimate` | ~340 | Customer-facing delivery message |
| `getShippingSpeedDays` | ~385 | EasyPost max delivery days |

**Make.com Payload Structure:**
```javascript
{
  application_id: 'APP-xxx',
  payment_status: 'completed',
  customer: { firstName, lastName, email, phone, signature_url },
  license_info: { licenseNumber, licenseState, ... },
  selections: { selected_permits, delivery_speed, shipping_category },
  shipping_address: { name, line1, city, state, zip, country },
  international_shipping: { country, pccc_code, full_address },
  customer_files: {
    id_document_url_1: 'https://...',
    passport_photo_url_1: 'https://...',
    signature_url: 'https://...',
  },
  easypost_shipment: {
    to_address: { ... },
    parcel: { length: 4, width: 6, height: 0.1, weight: 8 },
    max_delivery_days: 8,
  },
}
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "PGRST116: 0 rows" - Webhook can't find application

**Cause:** applicationId mismatch between frontend and backend

**Check:**
1. Frontend generates `APP-xxx` at line 2613
2. Backend extracts `applicationId` from request at line 317
3. Backend saves with that ID at line 453
4. Payment intent stores it in metadata at create-payment-intent.js line 244
5. Webhook queries by that ID at webhook.js line 260

**Fix:** Ensure backend uses frontend's ID, never generates its own

---

### Issue 2: Files not uploading / CORS errors

**Cause:** Supabase bucket not public or RLS policy misconfigured

**Fix:**
1. Go to Supabase → Storage → `application-files`
2. Make bucket public
3. Add RLS policy: Allow public INSERT and SELECT

---

### Issue 3: Webhook triggers twice

**Cause:** Frontend manually triggers webhook + Stripe auto-triggers

**Fix:** Remove manual webhook call from frontend (already fixed line 2773)

---

### Issue 4: Pricing mismatch / double charging

**Cause:** Multiple pricing definitions across files

**Fix:** Use `config/pricing.js` exclusively (already implemented)

---

### Issue 5: Vercel not deploying latest code

**Cause:** Force push doesn't trigger Vercel rebuild

**Fix:** 
```bash
git commit --allow-empty -m "Force deployment"
git push
```

---

## 🚀 DEPLOYMENT CHECKLIST

### Current (TEST MODE):
- [x] Vercel connected to GitHub repo `easypost-api`
- [x] Auto-deploy on push to `main` branch
- [x] Environment variables set in Vercel dashboard
- [x] Frontend code manually copied to Framer

### Switching to LIVE:

**1. Stripe:**
- [ ] Switch to live Stripe keys in Vercel env vars
- [ ] Update webhook secret for live mode
- [ ] Configure live webhook in Stripe dashboard
- [ ] Test payment with real card (not test mode)

**2. Domain:**
- [ ] Update CORS in all API files (new production domain)
- [ ] Update frontend API endpoints if domain changes
- [ ] Test from new domain

**3. Pricing:**
- [ ] Update `config/pricing.js` if prices change for live
- [ ] Update Stripe product IDs if using Stripe Products

**4. Supabase:**
- [ ] Verify storage bucket is production-ready
- [ ] Check RLS policies are secure
- [ ] Backup test database before switching

**5. Make.com:**
- [ ] Webhook URL stays the same (permanent)
- [ ] Verify automation is enabled
- [ ] Test full flow end-to-end

---

## 📊 TESTING PROCEDURES

### Full Flow Test:

**1. File Upload Test:**
```bash
# From frontend, upload files and check:
- Files appear in Supabase Storage browser
- Public URLs are accessible
- File metadata has {publicUrl, path, name, type, size}
```

**2. Database Save Test:**
```bash
# After form submission:
curl https://easypost-api.vercel.app/api/save-application \
  -H "Content-Type: application/json" \
  -d '{...}'

# Verify in Supabase:
SELECT application_id, payment_status, file_urls 
FROM applications 
WHERE application_id = 'APP-xxx'
```

**3. Payment Test:**
```bash
# Use Stripe test card: 4242 4242 4242 4242
# Check Vercel logs for:
- "=== PAYMENT INTENT DEBUG ===" section
- Extracted applicationId matches database
- No "0 rows" errors
```

**4. Make.com Test:**
```bash
# Check Make.com scenario history:
- Webhook received
- All data fields populated
- No errors in execution
```

---

## 🔍 DEBUGGING COMMANDS

### Check Git History:
```bash
# See recent changes
git log --oneline -10

# View file at specific commit
git show <commit>:<file-path>

# See what changed in a commit
git show <commit>
```

### Check Vercel Logs:
```bash
# In Vercel dashboard → Deployments → [latest] → Logs
# Or use Vercel CLI:
vercel logs [deployment-url]
```

### Test API Endpoints:
```bash
# Test save-application
curl -X POST https://easypost-api.vercel.app/api/save-application \
  -H "Content-Type: application/json" \
  -d @test-payload.json

# Test webhook
curl -X POST https://easypost-api.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment_intent.succeeded","data":{"object":{"id":"pi_test","metadata":{"applicationId":"APP-123"}}}}'
```

### Check Supabase:
```sql
-- Find recent applications
SELECT * FROM applications 
ORDER BY created_at DESC 
LIMIT 10;

-- Check payment status
SELECT application_id, payment_status, payment_completed_at 
FROM applications 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- View file URLs
SELECT application_id, file_urls->'driversLicense'->0->>'publicUrl' as license_url
FROM applications 
WHERE application_id = 'APP-xxx';
```

---

## 📝 MAINTENANCE NOTES

### Monthly Tasks:
- [ ] Review Vercel usage/costs
- [ ] Check Supabase storage usage
- [ ] Verify Make.com automation runs
- [ ] Review failed payments in Stripe dashboard

### When Issues Occur:
1. Check Vercel function logs first
2. Check Supabase database for saved applications
3. Check Stripe dashboard for payment intent status
4. Check Make.com scenario history
5. Review GitHub commit history for recent changes

### Code Review Before Changes:
1. Read this documentation fully
2. Understand the complete data flow
3. Check if change affects multiple files
4. Test locally if possible
5. Commit with descriptive message
6. Verify deployment in Vercel
7. Test complete flow end-to-end

---

## 🎯 QUICK REFERENCE

**Frontend generates ID:** `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`  
**Backend saves with that ID:** From `req.body.applicationId`  
**Payment stores ID:** In `metadata.applicationId`  
**Webhook finds by ID:** `.eq('application_id', applicationId)`  

**Files go directly to Supabase:** Frontend uploads, backend gets URLs  
**Pricing comes from one place:** `config/pricing.js`  
**Webhook is automatic:** Stripe calls it, frontend does NOT  
**Make.com URL is permanent:** Hardcoded in webhook.js  

**When switching to LIVE:** Update Stripe keys, CORS URLs, test thoroughly

---

*Last Updated: November 26, 2025 after 2-hour debugging session fixing applicationId mismatch, removing duplicate directories, centralizing pricing, and cleaning up unused code.*
