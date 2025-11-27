# FastIDP - International Driving Permit Application System

## Overview

FastIDP is a production web application that processes International Driving Permit (IDP) applications with automated payment processing, file storage, and business workflow automation. The system handles form submissions, file uploads, Stripe payments, and integrates with Make.com for order fulfillment.

**Tech Stack:**
- **Frontend:** React (Framer Motion deployment)
- **Backend:** Node.js serverless functions (Vercel)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (S3-compatible)
- **Payments:** Stripe (Embedded Payment Element)
- **Automation:** Make.com webhooks
- **Address Validation:** EasyPost API

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Vercel CLI (for local development)
- Supabase account
- Stripe account (test mode)
- EasyPost API key
- Make.com account

### Installation

```bash
# Clone repository
git clone <repository-url>
cd FastIDP

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run locally
vercel dev
```

### Environment Variables

Required environment variables (see `.env.example`):

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY_TEST=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# EasyPost
EASYPOST_API_KEY=your-easypost-key
```

---

## Documentation Structure

This project maintains comprehensive documentation across multiple files:

### 📘 README.md (This File)
**Purpose:** Project overview and onboarding guide  
**Audience:** New developers, project managers, stakeholders  
**Contents:**
- Quick start instructions
- High-level system architecture
- Installation and deployment
- Project handoff guide for new team members

### 📗 TECHNICAL_REFERENCE.md
**Purpose:** Complete technical specification  
**Audience:** Software engineers, DevOps, technical leads  
**Contents:**
- Detailed API endpoint documentation
- Database schema and relationships
- Configuration management
- Integration specifications (Stripe, Supabase, Make.com)
- Security and authentication
- Error handling patterns
- Troubleshooting procedures

**Use this when:**
- Implementing new features
- Debugging issues
- Understanding data flow
- Configuring external services

### 📙 AUDIT_FINDINGS.md
**Purpose:** System health and quality assessment  
**Audience:** Technical leads, project managers, QA engineers  
**Contents:**
- Security audit results
- Scalability assessment
- Code quality analysis
- Technical debt inventory
- Recommended improvements
- Testing coverage

**Use this when:**
- Planning improvements
- Assessing system readiness
- Prioritizing technical debt
- Preparing for scale



---

## System Architecture

### High-Level Flow

```
User Form → File Upload (Supabase) → Save Application (DB) 
    → Create Payment Intent → Stripe Payment → Webhook 
    → Update DB → Trigger Make.com → Order Fulfillment
```

### Key Components

1. **Frontend (`apply.jsx`)**
   - Multi-step form (Personal Info → Documents → Shipping → Payment)
   - Direct file uploads to Supabase Storage
   - Stripe Embedded Payment Element
   - Generates unique `applicationId`

2. **Backend API (`/api/*`)**
   - `save-application.js` - Saves form data to database
   - `create-payment-intent.js` - Creates Stripe payment
   - `webhook.js` - Handles Stripe events, triggers automation
   - `validate-address.js` - EasyPost address validation

3. **Configuration (`/config/*`)**
   - `pricing.js` - Single source of truth for all pricing

4. **Database (Supabase)**
   - `applications` table (44 columns)
   - JSONB fields for flexible data storage
   - Indexed on `application_id`

5. **Storage (Supabase Storage)**
   - Public bucket: `application-files`
   - Direct uploads from frontend
   - CDN-backed URLs

---

## Key Features

### Pricing Calculator
- Dynamic pricing based on permit count, processing speed, and shipping method
- Automatic tax calculation (7.75%)
- Real-time price updates in UI

### File Management
- Direct uploads to Supabase (bypasses API payload limits)
- Supports multiple file types (JPG, PNG, HEIC, PDF)
- Automatic file organization by application ID

### Payment Processing
- Stripe Embedded Payment Element (no redirect)
- Automatic webhook handling
- Payment status tracking in database

### International Fulfillment
- Automated processing for 20+ countries
- Manual review for complex cases
- EasyPost address validation

### Business Automation
- Make.com webhook integration
- Comprehensive payload with all application data
- Error tracking and retry logic

---

## Deployment

### Vercel Deployment

```bash
# Link to Vercel project
vercel link

# Deploy to production
vercel --prod
```

### Environment Configuration

1. **Vercel Dashboard:**
   - Settings → Environment Variables
   - Add all required variables from `.env.example`
   - Redeploy to apply changes

2. **Supabase Setup:**
   - Create `application-files` storage bucket (public)
   - Configure RLS policies (see SYSTEM_DOCUMENTATION.md)
   - Enable anonymous uploads for frontend

3. **Stripe Configuration:**
   - Register webhook endpoint: `https://your-domain.vercel.app/api/webhook`
   - Copy webhook secret to environment variables
   - Enable events: `payment_intent.succeeded`, `payment_intent.payment_failed`

4. **Make.com Setup:**
   - Create webhook trigger
   - Copy permanent URL
   - Update `api/webhook.js` line 572 with your URL

### Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] Supabase storage bucket created with RLS policies
- [ ] Stripe webhook endpoint registered
- [ ] Make.com webhook URL updated in code
- [ ] CORS configured for production domain
- [ ] Test complete flow in production
- [ ] Monitor initial transactions

---

## Development Workflow

### Making Changes

1. **Review SYSTEM_DOCUMENTATION.md** - Understand the complete data flow
2. **Check pricing.js** - Verify no hardcoded prices elsewhere
3. **Test locally** - Use `vercel dev` for local testing
4. **Commit frequently** - Keep atomic commits with clear messages
5. **Test in production** - Verify end-to-end flow after deployment

### Critical Rules

⚠️ **NEVER:**
- Generate new `applicationId` in backend (frontend owns this)
- Manually trigger webhooks from frontend (Stripe handles this)
- Hardcode pricing outside `config/pricing.js`
- Change Make.com webhook URL without updating code
- Deploy without testing payment flow

✅ **ALWAYS:**
- Extract `applicationId` from request body (line 317 in save-application.js)
- Store `applicationId` in Stripe metadata
- Query database by `applicationId`
- Upload files directly to Supabase from frontend
- Import pricing from `config/pricing.js`

---

## Testing

### Local Testing

```bash
# Start local development server
vercel dev

# Test file uploads
# 1. Fill out form in browser
# 2. Upload test files
# 3. Check Supabase Storage for files

# Test payment (use Stripe test cards)
# 4242 4242 4242 4242 - Success
# 4000 0000 0000 9995 - Decline

# Test webhook locally
stripe listen --forward-to localhost:3000/api/webhook
```

### Production Testing

1. **Complete Application Flow:**
   - Submit form with real data (use your email)
   - Upload valid documents
   - Complete payment with test card
   - Verify Make.com receives webhook

2. **Database Verification:**
   - Check Supabase dashboard for new record
   - Verify `application_id` matches frontend
   - Confirm `file_urls` contains Supabase URLs

3. **Webhook Verification:**
   - Check Stripe dashboard for webhook delivery
   - Review Vercel function logs for errors
   - Confirm Make.com scenario triggered

---

## Monitoring & Maintenance

### What to Monitor

1. **Vercel Function Logs:**
   - Check for 500 errors
   - Monitor webhook execution time
   - Review CORS errors

2. **Stripe Dashboard:**
   - Payment success rate
   - Webhook delivery status
   - Failed payment attempts

3. **Supabase:**
   - Database row count (approaching plan limits?)
   - Storage usage (GB consumed)
   - API request volume

4. **Make.com:**
   - Scenario execution success rate
   - Error notifications
   - Webhook payload validation

### Common Issues

See **SYSTEM_DOCUMENTATION.md** section "Common Issues & Solutions" for detailed troubleshooting.

---

## Developer Reference

### Getting Started

**Clone and Setup:**
```bash
git clone https://github.com/Gabe-W88/easypost-api.git
cd FastIDP
npm install
cp .env.example .env
# Add your credentials to .env
vercel dev
```

**Test the System:**
- Submit form with test data
- Upload sample files
- Complete payment with test card `4242 4242 4242 4242`
- Verify webhook triggers and Make.com receives payload

### Critical System Rules

**Application ID Flow:**
- Frontend generates ID: `APP-${timestamp}-${random}` (`apply.jsx:2613`)
- Backend extracts and uses frontend's ID (`api/save-application.js:317`)
- Never regenerate applicationId in backend

**File Upload Flow:**
- Files upload directly to Supabase Storage from browser
- Backend receives only metadata (URLs, not base64)
- Bypasses Vercel 4.5MB payload limit

**Payment & Webhook Flow:**
- Stripe automatically triggers webhooks on payment events
- Never manually trigger webhooks from frontend
- ApplicationId must be in Stripe metadata for webhook to find record

**Pricing Management:**
- All pricing in `config/pricing.js` (single source of truth)
- Never hardcode prices in application code
- Import helper functions for calculations

### Quick Reference

#### Code Locations
| Feature | File | Lines |
|---------|------|-------|
| Application ID generation | `apply.jsx` | 2613 |
| File upload logic | `apply.jsx` | 2616-2640 |
| Backend ID extraction | `api/save-application.js` | 317 |
| Payment intent creation | `api/create-payment-intent.js` | 173-244 |
| Webhook handling | `api/webhook.js` | 260-280 |
| Make.com trigger | `api/webhook.js` | 572 |
| Pricing configuration | `config/pricing.js` | All |

#### External Services
| Service | Purpose | Dashboard |
|---------|---------|-----------|
| Vercel | Hosting | https://vercel.com/dashboard |
| Supabase | Database & Storage | https://supabase.com/dashboard/project/dkpsbqhzpxnziudimlex |
| Stripe | Payments | https://dashboard.stripe.com |
| Make.com | Automation | https://www.make.com/scenarios |
| GitHub | Code Repository | https://github.com/Gabe-W88/easypost-api |

#### Access Requirements
- GitHub repository access (request from owner)
- Vercel team membership (deployment access)
- Supabase project collaborator (database access)
- Stripe account access (payment configuration)
- Make.com scenario access (webhook configuration)

### Documentation Map

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **README.md** | Project overview, quick start | First time setup, general reference |
| **TECHNICAL_REFERENCE.md** | Complete API docs, database schema | Implementing features, debugging |
| **AUDIT_FINDINGS.md** | Security audit, code quality | Understanding system health, planning improvements |
| **PROTOCOL.md** | Development workflow, AI guidelines | Day-to-day development, code reviews |

### Common Development Tasks

**Add New Form Field:**
1. Add field to `apply.jsx` form state
2. Update `formData` object in submit handler
3. Modify database schema in Supabase if needed
4. Update `config/pricing.js` if affects pricing
5. Test complete flow: form → save → payment → webhook

**Modify Pricing:**
1. Edit `config/pricing.js` only
2. Update PERMIT_PRICES, COMBINED_PRICING, or helper functions
3. No other file changes needed
4. Test payment calculations end-to-end

**Change Webhook Payload:**
1. Modify `api/webhook.js` automationData object (~line 420)
2. Update Make.com scenario to handle new fields
3. Test webhook delivery

**Add New API Endpoint:**
1. Create file in `/api/` directory
2. Set CORS headers for production domain
3. Add error handling with try-catch
4. Test locally with `vercel dev`
5. Deploy and monitor Vercel logs

### Troubleshooting

**Common Issues:**
- "Application not found" (PGRST116) → ApplicationId mismatch, check TECHNICAL_REFERENCE.md
- File upload fails → Check Supabase RLS policies and CORS
- Webhook not triggering → Verify Stripe webhook configuration
- CORS errors → Ensure all API files set correct origin headers
- Payment amount wrong → Verify pricing.js imports

**Debugging Resources:**
1. Vercel function logs (real-time errors)
2. Stripe webhook logs (delivery status)
3. Supabase logs (database queries)
4. TECHNICAL_REFERENCE.md troubleshooting section

### Project Information

- **Repository:** https://github.com/Gabe-W88/easypost-api
- **Production URL:** https://serious-flows-972417.framer.app
- **Deployment:** Vercel (auto-deploy on `main` branch)
- **Database:** Supabase (dkpsbqhzpxnziudimlex)
- **Last Updated:** November 26, 2025
- **Current Version:** 1.0
- **Status:** Production (active)

---

## License

Proprietary - All rights reserved

---

## Changelog

### November 26, 2025
- Fixed applicationId mismatch between frontend and backend
- Removed manual webhook trigger (now automatic via Stripe)
- Centralized pricing in `config/pricing.js`
- Removed duplicate `easypost-api/` directory
- Fixed double-charging bug in processing fees
- Created comprehensive documentation suite
- Completed security and scalability audit

### Previous Versions
- See git commit history for detailed changes
