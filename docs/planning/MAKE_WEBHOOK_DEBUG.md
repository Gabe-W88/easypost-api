# Make.com Webhook Debug

## How It Works

The Make.com webhook is triggered **automatically** when:
1. ✅ Payment completes successfully
2. ✅ Stripe sends `payment_intent.succeeded` webhook to `/api/webhook`
3. ✅ Webhook handler calls `triggerMakeAutomation()`
4. ✅ Data is sent to Make.com webhook URL

## Check These Things

### 1. Did Payment Complete?
- Check Supabase: `payment_status` should be `'completed'`
- If it's still `'pending'`, payment didn't complete yet

### 2. Check Vercel Function Logs
Go to Vercel → Functions → `api/webhook.js` → Logs

Look for:
- `=== triggerMakeAutomation called ===`
- `Sending to Make.com webhook...`
- `Make.com webhook response status:`

**If you see these logs:** Webhook is being called ✅
**If you don't see these logs:** Stripe webhook isn't firing

### 3. Check Stripe Webhook Events
- Go to Stripe Dashboard → Developers → Webhooks
- Check if `payment_intent.succeeded` events are being sent
- Check if they're succeeding (green) or failing (red)

### 4. Check Make.com Scenario
- Is your Make.com scenario enabled?
- Is the webhook module active?
- Check Make.com execution history for recent runs

## Quick Test

The webhook URL is: `https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b`

Test it directly:
```bash
curl -X POST https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

If Make.com receives it, the scenario should run.

## Most Likely Issues

1. **Payment didn't complete** - Check `payment_status` in Supabase
2. **Stripe webhook not configured** - Check Stripe dashboard
3. **Stripe webhook failing** - Check Vercel logs for errors
4. **Make.com scenario disabled** - Check Make.com dashboard

---

**Check Vercel webhook logs first** - that will tell us exactly what's happening.

