# FastIDP - Complete Project Overview

**Generated:** December 2025  
**Status:** Production System  
**Purpose:** Comprehensive understanding of project structure and tech stack

---

## 📋 Table of Contents

1. [Tech Stack Breakdown](#tech-stack-breakdown)
2. [Project Structure](#project-structure)
3. [File Organization](#file-organization)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Key Components](#key-components)
6. [Integration Points](#integration-points)
7. [Critical System Rules](#critical-system-rules)

---

## 🛠 Tech Stack Breakdown

### Frontend Layer

| Technology | Version | Purpose | Location |
|------------|---------|---------|----------|
| **React** | 18.2.0 | UI framework for form components | `apply.jsx`, `src/App.jsx` |
| **React DOM** | 18.2.0 | React rendering | `src/main.jsx` |
| **Vite** | 5.0.8 | Build tool and dev server | `vite.config.js` |
| **@vitejs/plugin-react** | 4.2.1 | Vite React plugin | Build config |

**Frontend Libraries:**
- `@stripe/stripe-js` (2.4.0) - Stripe client SDK
- `@stripe/react-stripe-js` (2.4.0) - Stripe React components (PaymentElement, AddressElement)
- `@supabase/supabase-js` (2.84.0) - Supabase client for direct file uploads

**Deployment:**
- **Framer** - Frontend hosting (`https://serious-flows-972417.framer.app`)

### Backend Layer

| Technology | Version | Purpose | Location |
|------------|---------|---------|----------|
| **Node.js** | 18+ | Runtime environment | Serverless functions |
| **Vercel Functions** | - | Serverless API hosting | `/api/*.js` |
| **Stripe** | 14.14.0 | Payment processing SDK | `api/create-payment-intent.js`, `api/webhook.js` |

**Backend Libraries:**
- `@supabase/supabase-js` - Database and storage operations
- `@easypost/api` (8.2.0) - Address validation API
- `pg` (8.11.3) - PostgreSQL client (if needed for direct DB access)

**Deployment:**
- **Vercel** - Serverless function hosting (`https://easypost-api.vercel.app`)

### Database & Storage

| Service | Purpose | Configuration |
|---------|---------|----------------|
| **Supabase PostgreSQL** | Application data storage | `applications` table (44 columns) |
| **Supabase Storage** | File storage (S3-compatible) | `application-files` bucket (public) |
| **Supabase URL** | `https://dkpsbqhzpxnziudimlex.supabase.co` | Service role key in env |

### External Services

| Service | Purpose | Integration Point |
|---------|---------|-------------------|
| **Stripe** | Payment processing | Embedded Payment Element, Webhooks |
| **Make.com** | Business workflow automation | Webhook trigger (`api/webhook.js:590`) |
| **EasyPost** | Address validation | `api/validate-address.js` |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Vite** | Development server, build tool |
| **Vercel CLI** | Local development (`vercel dev`) |
| **npm** | Package management |

---

## 📁 Project Structure

```
FastIDP/
├── api/                          # Serverless API endpoints (Vercel Functions)
│   ├── create-payment-intent.js  # Creates Stripe payment intent
│   ├── save-application.js        # Saves form data to database
│   ├── validate-address.js       # EasyPost address validation
│   └── webhook.js                # Stripe webhook handler + Make.com trigger
│
├── config/                       # Configuration files
│   └── pricing.js                # Single source of truth for all pricing
│
├── data/                         # Data files
│   └── countries-automation.csv   # Country automation mapping
│
├── docs/                         # Documentation
│   ├── archive/                  # Archived documentation
│   ├── audits/                   # Audit reports
│   │   ├── AUDIT_FINDINGS.md
│   │   ├── AUDIT_TEMPLATE.md
│   │   └── REGRESSION_AUDIT_COMPLETE.md
│   ├── guides/                   # Technical guides
│   │   ├── SYSTEM_DOCUMENTATION.md
│   │   └── TECHNICAL_REFERENCE.md
│   ├── planning/                 # Planning documents
│   └── README.md                 # Documentation index
│
├── src/                          # React application source
│   ├── App.jsx                   # Main app component (wraps MultistepForm)
│   └── main.jsx                  # React entry point
│
├── assets/                       # Static assets
│   └── images/                   # Image files
│
├── other-site-code/              # Additional components
│   ├── Pricing_Timeline_Calculator.jsx
│   └── protectyourself.jsx
│
├── apply.jsx                     # Main application form (8,200+ lines)
├── index.html                    # HTML entry point
├── package.json                  # Dependencies and scripts
├── vite.config.js                # Vite configuration
├── vercel.json                   # Vercel deployment config
└── README.md                     # Project overview
```

---

## 📄 File Organization

### Core Application Files

#### `apply.jsx` (8,200+ lines)
**Purpose:** Main multi-step application form component

**Key Features:**
- 4-step form: Personal Info → Documents → Shipping → Payment
- Form state management with validation
- Direct file uploads to Supabase Storage
- Stripe Payment Element integration
- Application ID generation: `APP-${timestamp}-${random}`
- Address validation with EasyPost
- International shipping support
- Signature capture

**State Management:**
- `formData` - All form field values
- `uploadedFiles` - File metadata (URLs from Supabase)
- `paymentState` - Payment intent and status
- `errors` / `touched` - Validation state
- `step` - Current form step (1-4)

**Key Functions:**
- `validateStep()` - Step-by-step validation
- `handleFileUpload()` - Direct Supabase upload
- `setupPayment()` - Creates payment intent
- `handlePaymentSuccess()` - Payment completion handler

#### `src/App.jsx`
**Purpose:** React app wrapper
- Renders `MultistepForm` from `apply.jsx`
- Sets background styling

#### `src/main.jsx`
**Purpose:** React entry point
- Renders `App` component
- Uses React 18 `createRoot` API

### API Endpoints (`/api/`)

#### `save-application.js` (550 lines)
**Purpose:** Save application data to database

**Flow:**
1. Receives `applicationId`, `formData`, `fileData` from frontend
2. Processes file uploads (handles both direct Supabase URLs and legacy base64)
3. Determines fulfillment type (automated vs manual) based on shipping country
4. Inserts record into `applications` table
5. Returns application data with pricing

**Key Functions:**
- `uploadFilesToStorage()` - Handles file uploads
- `determineFulfillmentType()` - Checks if country is in automated list
- `extractCountryFromAddress()` - Parses country from international address
- `calculatePricing()` - Calculates line items and totals

**Database Fields:**
- `application_id` - Unique identifier (from frontend)
- `form_data` - JSONB field with all form data
- `file_urls` - JSONB with file metadata (Supabase URLs)
- `payment_status` - 'pending' | 'completed' | 'expired'
- `fulfillment_type` - 'automated' | 'manual'
- International shipping fields (extracted to columns)

#### `create-payment-intent.js` (86 lines)
**Purpose:** Create Stripe payment intent

**Flow:**
1. Receives `applicationId` and `formData`
2. Calculates pricing using `config/pricing.js`
3. Creates Stripe PaymentIntent with metadata
4. Returns `clientSecret` for frontend

**Pricing Calculation:**
- Permit costs: `PERMIT_PRICES.idp * permitCount`
- Combined processing + shipping: `getCombinedPriceCents(category, speed)`
- Tax: `subtotal * TAX.rate` (7.75%)
- Total: `subtotal + tax`

**Stripe Metadata:**
- `applicationId` - Links payment to application
- `customer_email`, `customer_name`
- `permit_count`, `shipping_category`, `processing_speed`

#### `webhook.js` (645 lines)
**Purpose:** Handle Stripe webhooks and trigger Make.com automation

**Flow:**
1. Receives Stripe webhook event (signature verified)
2. Handles events: `payment_intent.succeeded`, `checkout.session.completed`
3. Updates database with payment status and address data
4. Triggers Make.com webhook with comprehensive automation data

**Key Functions:**
- `handlePaymentSucceeded()` - Updates DB, triggers automation
- `handleCheckoutCompleted()` - Legacy checkout support
- `triggerMakeAutomation()` - Sends data to Make.com

**Make.com Payload Includes:**
- Application identification
- Customer information
- License and travel info
- Shipping addresses (form + Stripe)
- File URLs (with transformations for email)
- EasyPost shipment data
- Business workflow settings

#### `validate-address.js` (169 lines)
**Purpose:** Validate addresses using EasyPost API

**Flow:**
1. Receives address fields (street1, city, state, zip, country)
2. Creates EasyPost Address with verification
3. Returns deliverability status and corrected address
4. Provides suggestions if address was standardized

**Features:**
- ZIP code mismatch detection
- Delivery verification
- Address standardization
- Preserves apartment numbers (street2) from user input

### Configuration Files

#### `config/pricing.js` (313 lines)
**Purpose:** Single source of truth for all pricing

**Exports:**
- `PERMIT_PRICES` - Permit costs (IDP: $20, IAPD: $20)
- `PROCESSING_COSTS` - Processing fees (standalone)
- `SHIPPING_COSTS` - Shipping fees by category
- `COMBINED_PRICING` - Processing + Shipping totals
- `DELIVERY_TIMELINES` - Delivery estimates by category/speed
- `TAX` - Tax rate (7.75%) and jurisdiction
- `STRIPE_PRODUCTS` - Stripe product IDs (test mode)

**Helper Functions:**
- `getCombinedPrice()` - Get combined price in dollars
- `getCombinedPriceCents()` - Get combined price in cents
- `calculateSubtotal()` - Calculate subtotal before tax
- `calculateTax()` - Calculate tax amount
- `calculateTotal()` - Calculate total with tax

### Configuration Files

#### `vercel.json`
**Purpose:** Vercel deployment configuration

**Settings:**
- Function timeouts: 60s for `save-application.js`, 30s for others
- Memory: 1024MB for `save-application.js`
- API route rewrites

#### `vite.config.js`
**Purpose:** Vite build configuration

**Settings:**
- React plugin
- Dev server: port 3000, auto-open

#### `package.json`
**Purpose:** Dependencies and scripts

**Scripts:**
- `dev` - Start Vite dev server
- `build` - Build for production
- `preview` - Preview production build

---

## 🔄 Data Flow Architecture

### Complete Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Form Entry                                         │
│ ─────────────────────────────────────────────────────────────── │
│ • Personal Information (name, email, phone, DOB)                │
│ • License Information (number, state, expiration)                │
│ • Address Information                                            │
│ • License Types Selection                                       │
│ • Travel Information                                             │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Document Upload                                         │
│ ─────────────────────────────────────────────────────────────── │
│ • Driver's License (front + back)                               │
│ • Passport Photo                                                │
│ • Signature Capture                                             │
│                                                                  │
│ Files upload DIRECTLY to Supabase Storage from browser          │
│ → Bypasses Vercel 4.5MB payload limit                           │
│ → Returns public URLs to frontend                               │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Processing & Shipping Selection                         │
│ ─────────────────────────────────────────────────────────────── │
│ • Processing Speed (standard/fast/fastest)                       │
│ • Shipping Category (domestic/international/military)           │
│ • Shipping Address (validated with EasyPost)                    │
│ • International Address (if applicable)                         │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND: Generate Application ID                               │
│ ─────────────────────────────────────────────────────────────── │
│ applicationId = `APP-${Date.now()}-${Math.random()}`           │
│ (Line 2613 in apply.jsx)                                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ API: POST /api/save-application                                 │
│ ─────────────────────────────────────────────────────────────── │
│ Request: { applicationId, formData, fileData }                  │
│                                                                  │
│ Backend:                                                        │
│ 1. Extract applicationId from request (line 317)                 │
│ 2. Process file metadata (already uploaded to Supabase)         │
│ 3. Determine fulfillment_type (automated vs manual)             │
│ 4. Insert into Supabase 'applications' table                    │
│ 5. Return application data + pricing                            │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ API: POST /api/create-payment-intent                            │
│ ─────────────────────────────────────────────────────────────── │
│ Request: { applicationId, formData }                            │
│                                                                  │
│ Backend:                                                        │
│ 1. Calculate pricing using config/pricing.js                    │
│ 2. Create Stripe PaymentIntent with metadata                    │
│ 3. Return clientSecret                                          │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Payment (Stripe Embedded Payment Element)              │
│ ─────────────────────────────────────────────────────────────── │
│ • Payment Element (card details)                                │
│ • Address Element (billing/shipping)                             │
│ • User completes payment                                        │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ STRIPE: Payment Success Event                                   │
│ ─────────────────────────────────────────────────────────────── │
│ Stripe automatically triggers webhook:                         │
│ → payment_intent.succeeded                                     │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ API: POST /api/webhook                                          │
│ ─────────────────────────────────────────────────────────────── │
│ 1. Verify Stripe webhook signature                             │
│ 2. Handle payment_intent.succeeded event                        │
│ 3. Update database: payment_status = 'completed'                │
│ 4. Extract billing/shipping address from PaymentMethod           │
│ 5. Trigger Make.com automation                                 │
└─────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│ Make.com Webhook Trigger                                        │
│ ─────────────────────────────────────────────────────────────── │
│ Comprehensive payload sent to Make.com:                        │
│ • Application data                                              │
│ • Customer information                                          │
│ • File URLs (with transformations)                             │
│ • Shipping data for EasyPost                                    │
│ • Business workflow settings                                    │
│                                                                  │
│ Make.com Scenario:                                              │
│ → Generates work order                                          │
│ → Sends customer thank you email                                │
│ → Creates shipping label (if automated country)                 │
│ → Stores PDFs in Supabase                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Key Data Transformations

1. **File Upload:**
   - Browser → Supabase Storage (direct)
   - Returns: `{ path, publicUrl }`
   - Stored in DB: `file_urls` JSONB field

2. **Application ID:**
   - Generated: Frontend (`apply.jsx:2613`)
   - Used: Backend extracts from request
   - Stored: Database `application_id` column
   - Linked: Stripe metadata `applicationId`

3. **Pricing Calculation:**
   - Source: `config/pricing.js`
   - Formula: `(permits × $20) + combined_price + tax`
   - Tax: 7.75% (Bellefontaine, OH)

4. **Fulfillment Type:**
   - Automated: 20 countries (AU, CA, GB, etc.) + domestic + military
   - Manual: All other international countries

---

## 🔧 Key Components

### Frontend Components

#### `MultistepForm` (apply.jsx)
- Main form component with 4 steps
- State management with React hooks
- Validation system with error tracking
- File upload handlers
- Payment integration

#### `FormField`
- Reusable form input component
- Supports text, select, textarea
- Validation styling (error/valid states)
- Optional tooltip support

#### `AddressField`
- Specialized address input
- EasyPost validation integration
- Address suggestion display

#### `Tooltip`
- Hover tooltip component
- Positioned dynamically
- Used for field help text

### Backend Functions

#### `save-application.js`
- File upload processing
- Database insertion
- Fulfillment type determination
- Pricing calculation

#### `create-payment-intent.js`
- Stripe PaymentIntent creation
- Pricing calculation
- Metadata attachment

#### `webhook.js`
- Stripe event handling
- Database updates
- Make.com automation trigger
- Error tracking

#### `validate-address.js`
- EasyPost API integration
- Address verification
- ZIP code validation
- Address standardization

---

## 🔌 Integration Points

### Supabase Integration

**Database:**
- Table: `applications` (44 columns)
- Primary key: `application_id`
- JSONB fields: `form_data`, `file_urls`
- Indexed on `application_id` for fast lookups

**Storage:**
- Bucket: `application-files` (public)
- Structure: `{applicationId}/{fileType}_{index}.{ext}`
- Direct uploads from browser (anonymous access)
- RLS policies configured for public read

**Client Initialization:**
- Frontend: Anonymous key (public)
- Backend: Service role key (full access)

### Stripe Integration

**Payment Flow:**
- Embedded Payment Element (no redirect)
- Payment Intent API (not Checkout Sessions)
- 3D Secure enabled automatically
- Metadata includes `applicationId`

**Webhook Configuration:**
- Endpoint: `https://easypost-api.vercel.app/api/webhook`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
- Signature verification enabled
- Raw body parsing for signature validation

**Test Mode:**
- Public key: `pk_test_51P8oMiRtjDxL2xZGzUyexo8wZKuOFmaNW59bMQ526nFjL6JZyDFkrzQXkWRIEkw9cw4eafRRtFLAYqTFwipOBKsx00y7zDiTOv`
- Secret key: From `STRIPE_SECRET_KEY_TEST` env var

### Make.com Integration

**Webhook URL:**
- `https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b`
- Permanent webhook URL (line 590 in webhook.js)

**Payload Structure:**
- Comprehensive application data
- Customer information
- File URLs with transformations
- EasyPost shipment data
- Business workflow settings

**Automation Tasks:**
- Work order generation
- Customer email notifications
- Shipping label creation (automated countries)
- PDF storage in Supabase

### EasyPost Integration

**Address Validation:**
- Endpoint: `api/validate-address.js`
- Verification enabled on address creation
- Returns deliverability status
- Provides standardized address suggestions

**Shipping Integration:**
- Used in Make.com automation
- Shipment data included in webhook payload
- Carrier selection based on shipping category
- Speed requirements for rate filtering

---

## ⚠️ Critical System Rules

### 1. Application ID Ownership
- ✅ **Frontend generates:** `APP-${timestamp}-${random}` (apply.jsx:2613)
- ✅ **Backend extracts:** From request body (save-application.js:317)
- ❌ **Never regenerate** in backend
- ✅ **Always use** frontend-provided ID

### 2. File Upload Strategy
- ✅ **Direct uploads** to Supabase from browser
- ✅ **Backend receives** only metadata (URLs, not base64)
- ✅ **Bypasses** Vercel 4.5MB payload limit
- ✅ **Stored in** `application-files` bucket

### 3. Webhook Automation
- ✅ **Stripe triggers** webhooks automatically
- ❌ **Never manually** trigger webhooks from frontend
- ✅ **Webhook handler** updates DB and triggers Make.com
- ✅ **ApplicationId** must be in Stripe metadata

### 4. Pricing Management
- ✅ **Single source:** `config/pricing.js`
- ❌ **Never hardcode** prices in application code
- ✅ **Import helpers:** `getCombinedPrice()`, `calculateTotal()`, etc.
- ✅ **Update pricing:** Edit `config/pricing.js` only

### 5. Database Queries
- ✅ **Query by:** `application_id` (indexed)
- ✅ **Use:** Service role key for backend operations
- ✅ **Store:** File URLs in `file_urls` JSONB field
- ✅ **Extract:** International fields to individual columns

### 6. CORS Configuration
- ✅ **Allowed origins:** Framer domain (`serious-flows-972417.framer.app`)
- ✅ **Headers:** Set in all API responses
- ✅ **Preflight:** Handle OPTIONS requests
- ✅ **Credentials:** Allow credentials for cookies/auth

### 7. Environment Variables
- ✅ **Supabase:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- ✅ **Stripe:** `STRIPE_SECRET_KEY_TEST`, `STRIPE_WEBHOOK_SECRET`
- ✅ **EasyPost:** `EASYPOST_API_KEY`
- ✅ **Never commit** secrets to repository

---

## 📊 System Metrics

### File Sizes
- `apply.jsx`: ~8,200 lines
- `webhook.js`: ~645 lines
- `save-application.js`: ~550 lines
- `pricing.js`: ~313 lines

### Database Schema
- Table: `applications`
- Columns: 44
- JSONB fields: `form_data`, `file_urls`
- Indexes: `application_id` (primary)

### API Endpoints
- `POST /api/save-application` - Save form data
- `POST /api/create-payment-intent` - Create payment
- `POST /api/webhook` - Stripe webhook handler
- `POST /api/validate-address` - Address validation

### Supported Features
- Multi-step form (4 steps)
- File uploads (JPG, PNG, HEIC, PDF)
- Address validation (EasyPost)
- Payment processing (Stripe)
- International shipping (20+ automated countries)
- Business automation (Make.com)
- Tax calculation (7.75%)
- Signature capture

---

## 🎯 Key Design Decisions

1. **Serverless Architecture**
   - Scalable, cost-effective
   - No server management
   - Auto-scaling with traffic

2. **Direct File Uploads**
   - Bypasses API payload limits
   - Faster uploads
   - Better user experience

3. **Frontend-Generated IDs**
   - Ensures consistency
   - Links payment to application
   - Prevents ID mismatches

4. **Centralized Pricing**
   - Single source of truth
   - Easy updates
   - No hardcoded values

5. **Automated vs Manual Fulfillment**
   - 20 countries automated
   - Others require manual review
   - Determined by shipping country

6. **Embedded Payment Element**
   - No redirects
   - Better UX
   - More control over flow

---

## 📚 Documentation Files

- **README.md** - Project overview and quick start
- **docs/guides/SYSTEM_DOCUMENTATION.md** - Complete system documentation
- **docs/guides/TECHNICAL_REFERENCE.md** - API and technical reference
- **docs/audits/AUDIT_FINDINGS.md** - Security and quality audit
- **PROJECT_OVERVIEW.md** - This file (complete project understanding)

---

## ✅ Production Status

- **Status:** Production (active)
- **Frontend:** Deployed on Framer
- **Backend:** Deployed on Vercel
- **Database:** Supabase (production)
- **Last Updated:** November 26, 2025
- **Version:** 1.0

---

## 🔍 Quick Reference

### Code Locations
- Application ID generation: `apply.jsx:2613`
- File upload logic: `apply.jsx:2616-2640`
- Backend ID extraction: `api/save-application.js:317`
- Payment intent creation: `api/create-payment-intent.js:51`
- Webhook handling: `api/webhook.js:173`
- Make.com trigger: `api/webhook.js:590`
- Pricing config: `config/pricing.js`

### External Services
- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://supabase.com/dashboard/project/dkpsbqhzpxnziudimlex
- **Stripe:** https://dashboard.stripe.com
- **Make.com:** https://www.make.com/scenarios
- **GitHub:** https://github.com/Gabe-W88/easypost-api

---

**End of Project Overview**

