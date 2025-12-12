# FastIDP - International Driving Permit Application System

## What This Is

A web application that processes International Driving Permit (IDP) applications. Customers fill out a form, upload documents, and pay online. The system automatically processes orders and creates shipping labels.

## How to View Applications

All applications are stored in **Supabase** (your database).

1. Go to [Supabase Dashboard](https://supabase.com)
2. Log in to your project
3. Click **Table Editor** → **applications**
4. You'll see all submitted applications with all their information

## What Happens When Someone Submits an Application

1. **Form Submission** → Data saved to Supabase
2. **Payment** → Processed through Stripe
3. **Automation** → Make.com receives the order and:
   - Creates shipping labels (for automated countries)
   - Sends customer emails
   - Updates tracking information back to Supabase

## Important URLs

- **Frontend (Form):** Your Framer site
- **Backend API:** `https://fastidp.vercel.app`
- **Database:** Supabase Dashboard
- **Payments:** Stripe Dashboard
- **Automation:** Make.com Dashboard

## Tech Stack (For Reference)

- **Frontend:** React (hosted on Framer)
- **Backend:** Vercel serverless functions
- **Database:** Supabase (PostgreSQL)
- **Payments:** Stripe
- **Automation:** Make.com
- **Address Validation:** EasyPost

## Support

For technical issues or questions, contact your developer.

---

**Note:** This system is fully automated. Once set up, applications flow through automatically from form submission to shipping label creation.
