# FastIDP Technical Reference

**Version:** 1.0  
**Last Updated:** November 26, 2025  
**Status:** Production  
**Maintainer:** Development Team

---

## Document Purpose

This technical reference provides complete documentation for the FastIDP application system. It is intended for:

- Software engineers implementing features or fixing bugs
- DevOps engineers managing deployment and infrastructure  
- Technical leads conducting code reviews
- New team members onboarding to the project

For a high-level overview, see `README.md`. For audit results, see `AUDIT_FINDINGS.md`.

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [API Reference](#api-reference)
3. [Database Schema](#database-schema)
4. [Configuration Management](#configuration-management)
5. [Integration Points](#integration-points)
6. [Security & Authentication](#security--authentication)
7. [File Storage](#file-storage)
8. [Error Handling](#error-handling)
9. [Deployment Procedures](#deployment-procedures)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Development Guidelines](#development-guidelines)

---

## System Architecture

### Overview

FastIDP uses a serverless architecture with the following key components:

- **Frontend:** React application deployed on Framer
- **Backend:** Node.js serverless functions on Vercel
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (S3-compatible)
- **Payment:** Stripe API
- **Automation:** Make.com webhooks
- **Address Validation:** EasyPost API

### Data Flow Sequence

```
User → Form Entry → File Upload (Supabase) → Save Application (API) 
→ Payment Intent (Stripe) → Payment Completion → Webhook (Stripe → API)
→ Database Update → Make.com Trigger → Order Fulfillment
```

### Critical Design Decisions

1. **Application ID Ownership:**
   - Frontend generates unique ID: `APP-${timestamp}-${random}`
   - Backend extracts and uses frontend-provided ID
   - Rationale: Ensures consistency across payment and database records

2. **File Upload Strategy:**
   - Files upload directly from browser to Supabase Storage
   - Backend receives only file metadata (URLs)
   - Rationale: Bypasses Vercel's 4.5MB payload limit

3. **Webhook Automation:**
   - Stripe automatically triggers webhooks on payment events
   - No manual webhook calls from frontend
   - Rationale: Reliable event-driven architecture

4. **Pricing Configuration:**
   - All pricing centralized in `config/pricing.js`
   - No hardcoded prices in application code
   - Rationale: Single source of truth for easy updates

---

## API Reference

### Endpoint: POST /api/save-application

**Purpose:** Persist application data and file metadata to database.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "applicationId": "APP-1732661234567-abc123def",
  "formData": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "streetAddress": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "selectedPermits": ["country1", "country2"],
    "processingOption": "standard|expedited|rush",
    "shippingCategory": "local|international"
  },
  "fileData": {
    "driversLicense": [
      {
        "name": "filename.jpg",
        "type": "image/jpeg",
        "size": 1234567,
        "path": "APP-xxx/drivers_license_1.jpg",
        "publicUrl": "https://supabase-url/..."
      }
    ],
    "passportPhoto": [...],
    "signature": {...}
  }
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "applicationId": "APP-1732661234567-abc123def",
  "data": {
    "application_id": "APP-xxx",
    "form_data": {...},
    "file_urls": {...},
    "payment_status": "pending",
    "created_at": "2025-11-26T12:00:00Z"
  },
  "pricing": {
    "permitTotal": 20.00,
    "processingCost": 49.00,
    "shippingCost": 0.00,
    "subtotal": 69.00,
    "tax": 5.35,
    "total": 74.35
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "Missing required fields",
  "details": "applicationId is required"
}
```

**Response (Error - 500):**
```json
{
  "error": "Failed to save application",
  "details": "Database connection error"
}
```

**Implementation Notes:**

- **File:** `api/save-application.js`
- **Timeout:** 60 seconds
- **Key Line 317:** Extracts `applicationId` from request body
- **File Handling:** Accepts pre-uploaded file URLs or base64 (signature only)
- **Fulfillment Type:** Determines if automated (20 countries) or manual processing

---

### Endpoint: POST /api/create-payment-intent

**Purpose:** Create Stripe PaymentIntent with application metadata.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "applicationId": "APP-1732661234567-abc123def",
  "formData": {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "selectedPermits": ["country1", "country2"],
    "processingOption": "standard|expedited|rush",
    "shippingCategory": "local|international"
  }
}
```

**Response (Success - 200):**
```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

**Response (Error - 400):**
```json
{
  "error": "Invalid request",
  "details": "Missing required fields"
}
```

**Response (Error - 500):**
```json
{
  "error": "Failed to create payment intent",
  "details": "Stripe API error"
}
```

**Implementation Notes:**

- **File:** `api/create-payment-intent.js`
- **Key Line 244:** Stores `applicationId` in Stripe metadata (critical for webhook)
- **Pricing:** Imports from `config/pricing.js` using `getCombinedPriceCents()`
- **Tax Calculation:** Applies 7.75% tax rate

---

### Endpoint: POST /api/webhook

**Purpose:** Handle Stripe webhook events (payment success/failure).

**Request Headers:**
```
stripe-signature: <webhook_signature>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_xxx",
      "metadata": {
        "applicationId": "APP-xxx"
      }
    }
  }
}
```

**Response (Success - 200):**
```json
{
  "received": true
}
```

**Response (Error - 400):**
```json
{
  "error": "Webhook signature verification failed"
}
```

**Implementation Notes:**

- **File:** `api/webhook.js`
- **Authentication:** Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
- **Key Line 183:** Retrieves full PaymentIntent from Stripe (with metadata)
- **Key Line 260:** Queries database by `applicationId` from metadata
- **Key Line 572:** Triggers Make.com automation with permanent URL
- **Events Handled:** `payment_intent.succeeded`, `payment_intent.payment_failed`

---

### Endpoint: POST /api/validate-address

**Purpose:** Validate shipping address using EasyPost API.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "street1": "string",
  "street2": "string (optional)",
  "city": "string",
  "state": "string",
  "zip": "string",
  "country": "US"
}
```

**Response (Success - 200):**
```json
{
  "valid": true,
  "address": {
    "street1": "123 Main St",
    "street2": "",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94102",
    "country": "US"
  }
}
```

**Response (Error - 400):**
```json
{
  "valid": false,
  "error": "Address not found",
  "suggestions": [...]
}
```

**Implementation Notes:**

- **File:** `api/validate-address.js`
- **Provider:** EasyPost API
- **Use Case:** Called during shipping address entry (Step 4)

---

## Database Schema

### Table: applications

**Primary Key:** `application_id` (VARCHAR, unique, indexed)

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `application_id` | VARCHAR | NO | Unique application ID (format: APP-xxx) |
| `form_data` | JSONB | YES | All form fields in JSON format |
| `file_urls` | JSONB | YES | File metadata with Supabase URLs |
| `payment_status` | VARCHAR | YES | pending / completed / failed |
| `payment_intent_id` | VARCHAR | YES | Stripe PaymentIntent ID |
| `stripe_charge_id` | VARCHAR | YES | Stripe Charge ID |
| `amount_paid` | DECIMAL | YES | Total amount in dollars |
| `fulfillment_type` | VARCHAR | YES | automated / manual |
| `make_automation_triggered_at` | TIMESTAMP | YES | When Make.com was triggered |
| `make_automation_status` | VARCHAR | YES | processing / completed / failed |
| `created_at` | TIMESTAMP | NO | Record creation timestamp |
| `updated_at` | TIMESTAMP | YES | Last update timestamp |
| `first_name` | VARCHAR | YES | Denormalized for queries |
| `last_name` | VARCHAR | YES | Denormalized for queries |
| `email` | VARCHAR | YES | Denormalized for queries |
| `phone` | VARCHAR | YES | Denormalized for queries |
| `date_of_birth` | DATE | YES | Applicant birth date |
| `birthplace_city` | VARCHAR | YES | Birth city |
| `birthplace_state` | VARCHAR | YES | Birth state |
| `street_address` | VARCHAR | YES | Mailing address |
| `street_address_2` | VARCHAR | YES | Address line 2 |
| `city` | VARCHAR | YES | City |
| `state` | VARCHAR | YES | State |
| `zip_code` | VARCHAR | YES | Postal code |
| `shipping_name` | VARCHAR | YES | Recipient name |
| `shipping_address` | JSONB | YES | Shipping address from Stripe |
| `billing_address` | JSONB | YES | Billing address from Stripe |

### JSONB Structure: form_data

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "birthplaceCity": "New York",
  "birthplaceState": "NY",
  "streetAddress": "123 Main St",
  "city": "San Francisco",
  "state": "CA",
  "zipCode": "94102",
  "selectedPermits": ["AU", "FR", "GB"],
  "processingOption": "expedited",
  "shippingCategory": "local",
  "driveAbroad": "yes",
  "departureDate": "2025-12-15",
  "permitEffectiveDate": "2025-12-10"
}
```

### JSONB Structure: file_urls

```json
{
  "driversLicense": [
    {
      "name": "license-front.jpg",
      "type": "image/jpeg",
      "size": 1234567,
      "path": "APP-xxx/drivers_license_1.jpg",
      "publicUrl": "https://dkpsbqhzpxnziudimlex.supabase.co/storage/v1/object/public/application-files/APP-xxx/drivers_license_1.jpg"
    }
  ],
  "passportPhoto": [...],
  "signature": {...}
}
```

### Indexes

- **Primary:** `application_id` (B-tree, unique)
- **Recommended (future):**
  - `created_at` (for time-based queries)
  - `payment_status` (for filtering)
  - `email` (for customer lookup)

---

## Configuration Management

### File: config/pricing.js

**Purpose:** Centralized pricing configuration - single source of truth.

**Exports:**

1. **PERMIT_PRICES**
   ```javascript
   {
     idp: 20.00 // Price per permit
   }
   ```

2. **PROCESSING_COSTS**
   ```javascript
   {
     standard: { local: 49, international: 99 },
     expedited: { local: 99, international: 149 },
     rush: { local: 149, international: 198 }
   }
   ```

3. **SHIPPING_COSTS**
   ```javascript
   {
     standard: { local: 0, international: 0 },
     expedited: { local: 0, international: 0 },
     rush: { local: 0, international: 0 }
   }
   ```

4. **COMBINED_PRICING** (Processing + Shipping)
   ```javascript
   {
     standard: { local: 49, international: 99 },
     expedited: { local: 99, international: 149 },
     rush: { local: 149, international: 198 }
   }
   ```

5. **Helper Functions**
   - `getCombinedPrice(category, speed)` - Returns dollar amount
   - `getCombinedPriceCents(category, speed)` - Returns cents for Stripe
   - `getSpeedDisplayName(speed)` - Returns user-facing name
   - `getProcessingTime(speed)` - Returns delivery timeline

**Usage Example:**

```javascript
import { getCombinedPriceCents, PERMIT_PRICES } from '../config/pricing.js'

// Calculate total
const permitTotal = formData.selectedPermits.length * PERMIT_PRICES.idp
const processingAndShipping = getCombinedPriceCents(
  formData.shippingCategory, 
  formData.processingOption
)
const subtotal = permitTotal * 100 + processingAndShipping
const tax = Math.round(subtotal * 0.0775)
const total = subtotal + tax
```

---

## Integration Points

### Stripe Integration

**API Version:** Latest  
**Mode:** Test (production keys available)  
**Integration Type:** Embedded Payment Element

**Configuration:**
- **Publishable Key (Frontend):** `pk_test_51P8oMiRt...`
- **Secret Key (Backend):** Environment variable `STRIPE_SECRET_KEY_TEST`
- **Webhook Secret:** Environment variable `STRIPE_WEBHOOK_SECRET`
- **Webhook Endpoint:** `https://serious-flows-972417.framer.app/api/webhook`

**Events Subscribed:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Metadata Fields (Critical):**
- `applicationId` - Links payment to database record
- `customer_email` - Customer email
- `customer_name` - Customer name
- `permit_count` - Number of permits
- `processing_type` - Speed selection
- `shipping_category` - Local or international

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 9995`

---

### Supabase Integration

**Project:** dkpsbqhzpxnziudimlex  
**Region:** US West

**Components Used:**
1. **PostgreSQL Database**
   - Table: `applications`
   - Connection: Service role key (backend only)

2. **Storage**
   - Bucket: `application-files` (public)
   - Access: Direct uploads from frontend using anon key
   - RLS Policies: Enabled (read: public, write: authenticated)

**Configuration:**
- **URL:** `https://dkpsbqhzpxnziudimlex.supabase.co`
- **Anon Key (Frontend):** Public key in `apply.jsx`
- **Service Role Key (Backend):** Environment variable `SUPABASE_SERVICE_ROLE_KEY`

**Storage Structure:**
```
application-files/
  └── APP-1732661234567-abc123def/
      ├── drivers_license_1.jpg
      ├── drivers_license_2.jpg
      ├── passport_photo_1.jpg
      └── signature_1.png
```

---

### Make.com Integration

**Purpose:** Business workflow automation for order fulfillment.

**Configuration:**
- **Webhook URL:** `https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b` (permanent)
- **Location:** Hardcoded in `api/webhook.js` line 572
- **Trigger:** Automatically called after successful payment

**Payload Structure:**
```json
{
  "application": {
    "application_id": "APP-xxx",
    "payment_intent_id": "pi_xxx",
    "amount_paid": 74.35,
    "payment_method": "card"
  },
  "customer": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "permits": {
    "selected_countries": ["AU", "FR", "GB"],
    "count": 3,
    "effective_date": "2025-12-10"
  },
  "processing": {
    "type": "expedited",
    "fulfillment_type": "automated",
    "processing_time": "5-7 business days"
  },
  "shipping": {
    "category": "local",
    "name": "John Doe",
    "address": {
      "line1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "postal_code": "94102",
      "country": "US"
    }
  },
  "files": {
    "drivers_license": [{
      "name": "license-front.jpg",
      "url": "https://supabase-url/...",
      "size": 1234567
    }],
    "passport_photo": [...],
    "signature": {...}
  }
}
```

**Error Handling:**
- Failures logged to database (`make_automation_status: 'failed'`)
- Error message stored in `make_automation_error`
- Manual retry available via database update

---

### EasyPost Integration

**Purpose:** Address validation for shipping addresses.

**Configuration:**
- **API Key:** Environment variable `EASYPOST_API_KEY`
- **Usage:** Called from `/api/validate-address` endpoint

**Supported Countries:**
- Automated processing: 20 countries (AU, AT, BE, CA, DK, FI, FR, DE, IE, IT, LU, MX, NL, NZ, NO, PT, ES, SE, CH, GB)
- Manual processing: All other countries

---

## Security & Authentication

### Environment Variables

All sensitive credentials stored as environment variables:

**Supabase:**
- `SUPABASE_URL` - Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Backend only (full access)

**Stripe:**
- `STRIPE_SECRET_KEY_TEST` - Test mode secret key
- `STRIPE_SECRET_KEY` - Production secret key (when ready)
- `STRIPE_WEBHOOK_SECRET` - Webhook signature verification

**EasyPost:**
- `EASYPOST_API_KEY` - Address validation API key

### CORS Configuration

**Allowed Origin:** `https://serious-flows-972417.framer.app`

**Implementation:** Hardcoded in all API files
- `api/save-application.js` lines 266, 469
- `api/create-payment-intent.js` lines 11, 202
- `api/webhook.js` lines 39, 127
- `api/validate-address.js` lines 40, 139

**Headers Set:**
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://serious-flows-972417.framer.app')
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
res.setHeader('Access-Control-Allow-Credentials', 'true')
```

### Webhook Security

**Stripe Webhook Verification:**
```javascript
const sig = req.headers['stripe-signature']
const event = stripe.webhooks.constructEvent(
  req.body, 
  sig, 
  process.env.STRIPE_WEBHOOK_SECRET
)
```

**Location:** `api/webhook.js` line 85

---

## File Storage

### Supabase Storage Configuration

**Bucket:** `application-files`  
**Access Level:** Public  
**RLS Policies:** Enabled

**Upload Strategy:**
1. Frontend uploads directly to Supabase (bypasses API)
2. Returns metadata: `{name, type, size, path, publicUrl}`
3. Backend stores metadata in database

**File Organization:**
```
application-files/
  └── {applicationId}/
      ├── drivers_license_{index}.{ext}
      ├── passport_photo_{index}.{ext}
      └── signature_{index}.{ext}
```

**Supported Formats:**
- Images: JPG, PNG, HEIC, HEIF
- Documents: PDF
- Maximum: No enforced limit (Supabase handles)

**CDN:**
- Public URLs automatically CDN-backed
- Format: `https://dkpsbqhzpxnziudimlex.supabase.co/storage/v1/object/public/application-files/...`

---

## Error Handling

### Error Logging

**Console Logging:**
- 26 `console.error()` statements for error tracking
- 25 `console.log()` statements for debugging (consider removing in production)

**Error Types:**

1. **400 Bad Request** - Validation errors (missing fields, invalid data)
2. **500 Internal Server Error** - Database errors, external API failures

### Try-Catch Coverage

**Total:** 13 try-catch blocks across API files

**Protected Operations:**
- File uploads to Supabase Storage
- Database queries (Supabase)
- Stripe API calls
- Make.com webhook triggers
- EasyPost address validation

### Database Error Tracking

**Automation Status:**
- `make_automation_status`: `processing`, `completed`, `failed`
- `make_automation_error`: Error message text
- `make_automation_triggered_at`: Timestamp

**Payment Status:**
- `payment_status`: `pending`, `completed`, `failed`

---

## Deployment Procedures

### Vercel Deployment

**Platform:** Vercel  
**Framework:** Node.js  
**Region:** Auto (Vercel Edge Network)

**Deployment Steps:**

1. **Initial Setup:**
   ```bash
   npm install -g vercel
   vercel login
   vercel link
   ```

2. **Configure Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Add all variables from `.env.example`
   - Apply to: Production, Preview, Development

3. **Deploy:**
   ```bash
   git push origin main
   # Vercel auto-deploys on push
   ```

4. **Manual Deploy (if needed):**
   ```bash
   vercel --prod
   ```

**Post-Deployment Checklist:**
- [ ] Test `/api/save-application` endpoint
- [ ] Test `/api/create-payment-intent` endpoint
- [ ] Verify Stripe webhook receives events
- [ ] Confirm Make.com receives automation payload
- [ ] Check Supabase storage uploads work
- [ ] Review Vercel function logs for errors

### Environment Configuration

**Required for All Environments:**
```env
SUPABASE_URL=https://dkpsbqhzpxnziudimlex.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
EASYPOST_API_KEY=EZAK...
```

**Production Additional:**
```env
STRIPE_SECRET_KEY=sk_live_...
NODE_ENV=production
```

---

## Troubleshooting Guide

### Issue: "Application not found" (PGRST116)

**Symptom:** Webhook can't find application in database.

**Root Cause:** ApplicationId mismatch between frontend and backend.

**Solution:**
1. Verify line 317 in `api/save-application.js` extracts ID from request
2. Check frontend sends `applicationId` in request body
3. Confirm Stripe metadata includes `applicationId` (line 244 in `create-payment-intent.js`)
4. Query database: `SELECT * FROM applications WHERE application_id LIKE 'APP-%'`

**Prevention:** Never generate new `applicationId` in backend.

---

### Issue: Files not uploading

**Symptom:** File upload fails or returns error.

**Root Cause:** Supabase RLS policies or CORS misconfiguration.

**Solution:**
1. Check Supabase Storage bucket exists: `application-files`
2. Verify RLS policies allow anonymous uploads
3. Check frontend uses correct Supabase anon key
4. Review browser console for CORS errors

**Debug:**
```javascript
const { data, error } = await supabase.storage
  .from('application-files')
  .upload(fileName, file)

console.log('Upload result:', { data, error })
```

---

### Issue: Webhook not triggering

**Symptom:** Payment succeeds but Make.com doesn't receive data.

**Root Cause:** Stripe webhook not configured or signature verification failed.

**Solution:**
1. Check Stripe Dashboard → Developers → Webhooks
2. Verify endpoint URL matches deployment
3. Confirm webhook secret in environment variables
4. Check Vercel logs for webhook execution

**Test Webhook Locally:**
```bash
stripe listen --forward-to localhost:3000/api/webhook
stripe trigger payment_intent.succeeded
```

---

### Issue: Pricing incorrect

**Symptom:** Payment amount doesn't match expected total.

**Root Cause:** Hardcoded prices or calculation error.

**Solution:**
1. Verify all imports use `config/pricing.js`
2. Check calculation logic matches:
   - Permit total: `count × $20`
   - Processing + Shipping: from `COMBINED_PRICING`
   - Tax: `subtotal × 7.75%`
3. Search codebase for hardcoded numbers: `grep -r "\$[0-9]" api/`

---

### Issue: CORS errors

**Symptom:** Frontend can't call API endpoints.

**Root Cause:** CORS headers not set or incorrect origin.

**Solution:**
1. Verify all API files set CORS headers
2. Check origin matches: `https://serious-flows-972417.framer.app`
3. Ensure headers set in both success and error responses

**Fix:** Add to all API files:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://serious-flows-972417.framer.app')
res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
```

---

## Development Guidelines

### Code Modification Rules

**NEVER:**
- Generate new `applicationId` in backend (frontend owns this)
- Manually trigger webhooks from frontend (Stripe handles automatically)
- Hardcode pricing outside `config/pricing.js`
- Change Make.com webhook URL without updating code
- Deploy without testing complete flow
- Create duplicate directories or files

**ALWAYS:**
- Extract `applicationId` from request body (line 317 in save-application.js)
- Store `applicationId` in Stripe metadata (line 244 in create-payment-intent.js)
- Query database by `applicationId` (line 260 in webhook.js)
- Upload files directly to Supabase from frontend
- Import pricing from `config/pricing.js`
- Test end-to-end flow after changes
- Commit frequently with clear messages
- Document breaking changes

### Testing Checklist

Before deploying changes:

- [ ] File uploads work (check Supabase Storage)
- [ ] Application saves to database with correct ID
- [ ] Payment intent created with metadata
- [ ] Stripe payment completes successfully
- [ ] Webhook finds application and updates status
- [ ] Make.com receives complete payload
- [ ] No errors in Vercel function logs
- [ ] CORS headers set correctly

### Code Review Checklist

When reviewing pull requests:

- [ ] No hardcoded prices (all use `config/pricing.js`)
- [ ] No manual webhook triggers
- [ ] ApplicationId flow preserved (frontend → backend → Stripe → webhook)
- [ ] File upload logic unchanged (direct to Supabase)
- [ ] Error handling added for new code
- [ ] CORS headers set in new endpoints
- [ ] Environment variables used for secrets
- [ ] Tests performed in staging/production

---

## Appendix

### Key File Locations

| Purpose | File | Key Lines |
|---------|------|-----------|
| Application ID generation | `apply.jsx` | 2613 |
| File upload to Supabase | `apply.jsx` | 2616-2640 |
| Backend ID extraction | `api/save-application.js` | 317 |
| Database insertion | `api/save-application.js` | 453 |
| Payment intent creation | `api/create-payment-intent.js` | 173-244 |
| Metadata storage | `api/create-payment-intent.js` | 244 |
| Webhook signature verification | `api/webhook.js` | 85 |
| Payment intent retrieval | `api/webhook.js` | 183 |
| Database query by ID | `api/webhook.js` | 260 |
| Make.com trigger | `api/webhook.js` | 572 |
| Pricing configuration | `config/pricing.js` | All |

### External Resources

- **Stripe Documentation:** https://stripe.com/docs/api
- **Supabase Documentation:** https://supabase.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **EasyPost Documentation:** https://www.easypost.com/docs/api
- **Make.com Documentation:** https://www.make.com/en/help/scenarios

### Changelog

**November 26, 2025:**
- Fixed applicationId mismatch (frontend vs backend)
- Removed manual webhook trigger
- Centralized pricing in `config/pricing.js`
- Removed duplicate `easypost-api/` directory
- Fixed double-charging bug
- Created comprehensive documentation
- Completed security audit

---

**Document Version:** 1.0  
**Next Review Date:** December 26, 2025  
**Maintained By:** Development Team
