# Client Handoff Checklist

## 1. Clean Up Files

### Delete These Planning Docs (no longer needed):
- `docs/planning/MAKE_UPDATE_SHIPPING.md`
- `docs/planning/MAKE_WEBHOOK_DEBUG.md`
- `docs/planning/FINAL_VERIFICATION.md`
- `docs/planning/QUICK_FIX.md`
- `docs/planning/SETUP_GUIDE.md`
- `docs/planning/CLEAN_SUPABASE_SETUP.md`
- `docs/planning/SUPABASE_TRACKING_SETUP.md`
- `docs/planning/GOOGLE_SHEETS_MAPPING.md`
- `docs/planning/MAKE_COM_QUICK_REFERENCE.md`

### Keep These (useful docs):
- `README.md` - Main project docs
- `PROJECT_OVERVIEW.md` - High-level overview
- `docs/guides/TECHNICAL_REFERENCE.md` - Technical docs
- `docs/guides/SYSTEM_DOCUMENTATION.md` - System docs
- `docs/audits/` - Audit docs (if client wants them)

---

## 2. URLs/Webhooks to Update for Production

### A. Frontend URLs (in `apply.jsx`):
- Line 1763, 1970: `https://easypost-api.vercel.app/api/validate-address` → Update to client's Vercel URL
- Line 2608: `https://easypost-api.vercel.app/api/save-application` → Update to client's Vercel URL
- Line 2632: `https://easypost-api.vercel.app/api/create-payment-intent` → Update to client's Vercel URL
- Line 2655: `https://easypost-api.vercel.app/api/create-checkout` → Update to client's Vercel URL
- Line 3500: `https://serious-flows-972417.framer.app/terms` → Update to client's Framer URL

### B. CORS Origins (in API files):
Update these files to allow client's Framer domain:
- `api/save-application.js` (lines 360, 369, 638, 646)
- `api/webhook.js` (lines 552, 565, 639)
- `api/create-payment-intent.js` (line 7)
- `api/validate-address.js` (lines 41, 140)

Replace: `https://serious-flows-972417.framer.app`
With: Client's production Framer domain

### C. Make.com Webhook URL:
- `api/webhook.js` line 1469: `https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b`
  - Client needs to create their own Make.com webhook and update this URL

### D. Make.com Update Shipping Endpoint:
- Client needs to update their Make.com HTTP module to call:
  - `https://[CLIENT-VERCEL-URL]/api/update-shipping`

---

## 3. Environment Variables to Set

### Vercel Environment Variables:
Client needs to set these in Vercel dashboard:

**Supabase:**
- `SUPABASE_URL` - Client's Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Client's Supabase service role key
- `SUPABASE_ANON_KEY` - Client's Supabase anon key (if needed)

**Stripe:**
- `STRIPE_SECRET_KEY` - Client's Stripe LIVE secret key (starts with `sk_live_`)
- `STRIPE_PUBLISHABLE_KEY` - Client's Stripe LIVE publishable key (starts with `pk_live_`)
- `STRIPE_WEBHOOK_SECRET` - Client's Stripe webhook secret (from Stripe dashboard)

**EasyPost:**
- `EASYPOST_API_KEY` - Client's EasyPost API key

**Make.com:**
- `MAKE_WEBHOOK_URL` - Client's Make.com webhook URL (optional, can hardcode in webhook.js)

---

## 4. Vercel Project Transfer

### Option A: Transfer Existing Project
1. Go to Vercel Dashboard → Project Settings → General
2. Scroll to "Transfer Project"
3. Enter client's email/team
4. Client accepts transfer

### Option B: Create New Project (Recommended)
1. Client creates new Vercel account/team
2. Client connects their GitHub repo
3. Client imports project from GitHub
4. Client sets environment variables (see section 3)
5. Client updates custom domain (if needed)

**After Transfer:**
- Update all API URLs in `apply.jsx` to new Vercel URL
- Update CORS origins in all API files
- Test all endpoints

---

## 5. Supabase Transfer

### Option A: Export/Import Database
1. **Export from your Supabase:**
   - Go to SQL Editor
   - Run: `pg_dump` or use Supabase dashboard export
   - Or just run `supabase_clean_start.sql` on client's Supabase

2. **Import to client's Supabase:**
   - Client creates new Supabase project
   - Client runs `supabase_clean_start.sql` in their SQL Editor
   - Client updates `SUPABASE_URL` and keys in Vercel

### Option B: Fresh Start (Recommended)
1. Client creates new Supabase project
2. Client runs `supabase_clean_start.sql` in SQL Editor
3. Client creates storage bucket: `application-files`
4. Client sets bucket to public (if needed)
5. Client updates Vercel environment variables

**Storage Setup:**
- Bucket name: `application-files`
- Public: Yes (for file access)
- File size limit: Set appropriate limit

---

## 6. Stripe Setup

### Client Needs to:
1. Create Stripe account (or use existing)
2. Get LIVE API keys (not test keys)
3. Set up webhook endpoint:
   - URL: `https://[CLIENT-VERCEL-URL]/api/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `checkout.session.completed`
     - `checkout.session.expired`
4. Copy webhook signing secret to Vercel env var: `STRIPE_WEBHOOK_SECRET`
5. Update `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in Vercel

---

## 7. Make.com Setup

### Client Needs to:
1. Create Make.com account
2. Create new scenario/webhook
3. Get webhook URL
4. Update `api/webhook.js` line 1469 with new webhook URL
5. Set up HTTP module to call `https://[CLIENT-VERCEL-URL]/api/update-shipping`
6. Configure EasyPost integration in Make.com
7. Test full workflow

---

## 8. GitHub Transfer

1. **You:**
   - Push final code to GitHub
   - Make sure all sensitive data is removed (use .env, not hardcoded)

2. **Client:**
   - Creates their own GitHub repo
   - You transfer repo OR client forks/clones
   - Client connects repo to their Vercel

---

## 9. Testing Checklist

After handoff, client should test:

- [ ] Form submission saves to Supabase
- [ ] File uploads work (check Supabase Storage)
- [ ] Payment processing works (Stripe test mode first)
- [ ] Webhook triggers Make.com
- [ ] Make.com updates Supabase with tracking
- [ ] All API endpoints respond correctly
- [ ] CORS works from Framer domain
- [ ] Address validation works

---

## 10. Files to Give Client

- All code (GitHub repo)
- `supabase_clean_start.sql` - Database setup
- `add_missing_columns.sql` - If needed
- `README.md` - Documentation
- This checklist
- Environment variables list (without actual values)

---

## Quick Commands for Client

```bash
# Clone repo
git clone [client-repo-url]
cd FastIDP

# Install
npm install

# Run locally (if needed)
vercel dev

# Deploy
git push origin main  # (if connected to Vercel)
```

---

## Important Notes

- **Never commit `.env` files** - Use Vercel environment variables
- **Test in Stripe test mode first** before going live
- **Backup Supabase** before making changes
- **Monitor Vercel logs** for errors
- **Keep Make.com webhook URL secure**

