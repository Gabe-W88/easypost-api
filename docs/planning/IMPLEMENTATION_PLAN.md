# Google Sheets Implementation Plan

**Status:** Recommended - All use cases validated  
**Priority:** High  
**Estimated Time:** 15-20 minutes  
**Complexity:** Low (no code changes needed)

---

## Decision: ✅ Implement Google Sheets

**Validated Use Cases:**
- ✅ Non-technical staff need spreadsheet view
- ✅ Quick analysis/reporting needed
- ✅ Easy sharing with stakeholders required

**Recommendation:** Add Google Sheets sync via Make.com

---

## Implementation Strategy

### Phase 1: Core Fields (Start Here)
**Goal:** Get basic data syncing first, then expand

**Essential Columns:**
1. Application ID
2. Date Submitted
3. Customer Name
4. Email
5. Phone
6. Amount Paid
7. Payment Status
8. Shipping Category
9. Processing Speed

**Why Start Small:**
- Faster to set up and test
- Easier to debug
- Can add more fields later

### Phase 2: Extended Fields (After Phase 1 Works)
**Goal:** Add detailed information for analysis

**Additional Columns:**
- License information
- Shipping addresses
- International shipping details
- File URLs
- Tax breakdown
- Timestamps

### Phase 3: Enhancements (Optional)
**Goal:** Make spreadsheet more useful

- Formulas for calculations
- Conditional formatting
- Pivot tables for reporting
- Data validation
- Summary dashboard

---

## Step-by-Step Implementation

### Step 1: Create Google Spreadsheet Template (5 min)

1. **Create New Sheet:**
   - Name: "FastIDP Applications - [Date]"
   - Or: "FastIDP Applications" (if starting fresh)

2. **Set Up Headers (Row 1):**

```
A: Application ID
B: Date Submitted
C: Customer Name
D: Email
E: Phone
F: Amount Paid
G: Payment Status
H: Shipping Category
I: Processing Speed
J: Fulfillment Type
K: Stripe Payment ID
L: License Number
M: License State
N: Shipping Address
O: Shipping City
P: Shipping State
Q: Shipping ZIP
R: International Country
S: Selected Permits
T: Tax Amount
U: Subtotal
V: Notes
```

3. **Format Headers:**
   - Bold Row 1
   - Freeze Row 1 (View → Freeze → 1 row)
   - Add background color (light gray)
   - Center align text

4. **Set Column Widths:**
   - Application ID: 150px
   - Date Submitted: 120px
   - Customer Name: 200px
   - Email: 250px
   - Phone: 130px
   - Amount Paid: 100px
   - Others: Auto-fit

5. **Save and Share:**
   - Share with team members (Viewer or Editor)
   - Copy the spreadsheet URL for reference

### Step 2: Update Make.com Scenario (10 min)

1. **Open Make.com Scenario:**
   - Go to your existing scenario
   - Find the webhook trigger module

2. **Add Google Sheets Module:**
   - Click "+" after webhook module
   - Search: "Google Sheets"
   - Select: "Add a Row"

3. **Connect Google Account:**
   - Click "Create a connection"
   - Sign in with Google
   - Allow Make.com access
   - Select spreadsheet: "FastIDP Applications"
   - Select worksheet: "Sheet1"

4. **Map Core Fields (Phase 1):**

**Essential Mapping:**
```
Application ID → {{1.application_id}}
Date Submitted → {{1.timestamps.created_at}}
Customer Name → {{1.customer.full_name}}
Email → {{1.customer.email}}
Phone → {{1.customer.phone}}
Amount Paid → {{1.amount_total}}
Payment Status → {{1.payment_status}}
Shipping Category → {{1.selections.shipping_category}}
Processing Speed → {{1.selections.delivery_speed}}
```

5. **Save Module:**
   - Click "OK" to save
   - Module should show green checkmark

### Step 3: Test (5 min)

1. **Run Test:**
   - Option A: Complete a test application (recommended)
   - Option B: Click "Run once" in Make.com (if you have test data)

2. **Verify:**
   - Check Google Sheet for new row
   - Verify data appears correctly
   - Check all mapped fields

3. **Fix Issues (if any):**
   - Check Make.com execution log
   - Verify field mappings
   - Re-test

### Step 4: Add Extended Fields (After Testing)

Once Phase 1 works, add more fields:

**Extended Mapping:**
```
Fulfillment Type → (needs to be fetched from Supabase or added to webhook)
Stripe Payment ID → {{1.stripe_payment_intent_id}}
License Number → {{1.license_info.license_number}}
License State → {{1.license_info.license_state}}
Shipping Address → {{1.shipping_address.line1}}
Shipping City → {{1.shipping_address.city}}
Shipping State → {{1.shipping_address.state}}
Shipping ZIP → {{1.shipping_address.postal_code}}
International Country → {{1.international_shipping.country}}
Selected Permits → {{1.selections.selected_permits}}
Tax Amount → {{1.tax_details.tax_amount}}
Subtotal → {{1.tax_details.subtotal}}
```

**Note:** For `fulfillment_type`, you may need to:
- Add it to the webhook payload in `api/webhook.js`, OR
- Query Supabase in Make.com to get it

### Step 5: Activate & Monitor

1. **Activate Scenario:**
   - Toggle scenario to "Active"
   - New applications will auto-sync

2. **Monitor First Few:**
   - Watch first 3-5 applications
   - Verify data accuracy
   - Check for any errors

3. **Share with Team:**
   - Share Google Sheet link
   - Set appropriate permissions
   - Train team on using the sheet

---

## Quick Reference: Field Mapping

### From Webhook Payload to Google Sheets

| Google Sheet Column | Make.com Data Path | Notes |
|---------------------|-------------------|-------|
| Application ID | `{{1.application_id}}` | Required |
| Date Submitted | `{{1.timestamps.created_at}}` | ISO format - may need formatting |
| Customer Name | `{{1.customer.full_name}}` | |
| Email | `{{1.customer.email}}` | |
| Phone | `{{1.customer.phone}}` | |
| Amount Paid | `{{1.amount_total}}` | Format as currency |
| Payment Status | `{{1.payment_status}}` | |
| Shipping Category | `{{1.selections.shipping_category}}` | |
| Processing Speed | `{{1.selections.delivery_speed}}` | |
| Stripe Payment ID | `{{1.stripe_payment_intent_id}}` | |
| License Number | `{{1.license_info.license_number}}` | |
| License State | `{{1.license_info.license_state}}` | |
| Shipping Address | `{{1.shipping_address.line1}}` | |
| Shipping City | `{{1.shipping_address.city}}` | |
| Shipping State | `{{1.shipping_address.state}}` | |
| Shipping ZIP | `{{1.shipping_address.postal_code}}` | |
| International Country | `{{1.international_shipping.country}}` | May be null |
| Selected Permits | `{{1.selections.selected_permits}}` | Array - may need join |
| Tax Amount | `{{1.tax_details.tax_amount}}` | |
| Subtotal | `{{1.tax_details.subtotal}}` | |

---

## Optional: Add Fulfillment Type to Webhook

Currently, `fulfillment_type` is stored in Supabase but not in the webhook payload. 

**Option A:** Add to webhook payload (recommended)

Edit `api/webhook.js` around line 400, add to `automationData`:

```javascript
// In triggerMakeAutomation function, after fetching application data
const { data: appData } = await supabase
  .from('applications')
  .select('fulfillment_type')
  .eq('application_id', applicationId)
  .single()

// Then add to automationData:
automationData.fulfillment_type = appData?.fulfillment_type || 'manual'
```

**Option B:** Query Supabase in Make.com
- Add "Supabase > Get a Row" module
- Query by application_id
- Extract fulfillment_type

**Recommendation:** Option A is cleaner and faster.

---

## Spreadsheet Enhancements

### Add Formulas

**Summary Row (Row 2, hidden or at top):**
```
Total Applications: =COUNTA(A:A)-1
Total Revenue: =SUM(F:F)
Average Order: =AVERAGE(F:F)
This Month: =COUNTIFS(B:B,">="&EOMONTH(TODAY(),-1)+1,B:B,"<="&EOMONTH(TODAY(),0))
```

### Add Conditional Formatting

**Payment Status:**
- Green: `=G2="completed"`
- Yellow: `=G2="pending"`
- Red: `=G2="failed"`

**Shipping Category:**
- Different colors for domestic/international/military

### Add Data Validation

**Payment Status Column:**
- Dropdown: pending, completed, failed

**Shipping Category Column:**
- Dropdown: domestic, international, military

### Create Pivot Tables

**For Reporting:**
1. Revenue by Shipping Category
2. Applications by Processing Speed
3. Revenue by Month
4. International vs Domestic breakdown

---

## Testing Checklist

- [ ] Google Sheet created with headers
- [ ] Make.com scenario updated
- [ ] Google Sheets module added
- [ ] Core fields mapped
- [ ] Test application completed
- [ ] Data appears in Google Sheet
- [ ] All fields verified
- [ ] Extended fields added (optional)
- [ ] Formulas added (optional)
- [ ] Conditional formatting applied (optional)
- [ ] Scenario activated
- [ ] Team notified and trained

---

## Maintenance

### Weekly
- Check Make.com execution logs
- Verify new applications sync
- Review data accuracy

### Monthly
- Archive old data (if needed)
- Review and optimize formulas
- Update field mappings if webhook changes

### As Needed
- Add new columns for new requirements
- Update formulas for new calculations
- Adjust formatting for better readability

---

## Troubleshooting

### No Rows Appearing
1. Check Make.com execution log
2. Verify Google Sheets module executed
3. Check field mappings
4. Verify Google account permissions

### Wrong Data
1. Check data paths in Make.com
2. Verify webhook payload structure
3. Test with single field first
4. Check for null values

### Duplicate Rows
1. Check if scenario runs multiple times
2. Add deduplication logic (search before add)
3. Verify webhook only triggers once

---

## Next Steps

1. **Today:** Create Google Sheet template
2. **Today:** Update Make.com scenario with core fields
3. **Today:** Test with one application
4. **This Week:** Add extended fields
5. **This Week:** Add enhancements (formulas, formatting)
6. **Ongoing:** Monitor and maintain

---

## Success Criteria

✅ New applications automatically appear in Google Sheet  
✅ All core fields populated correctly  
✅ Team can view and analyze data easily  
✅ Stakeholders can access shared sheet  
✅ No manual data entry required  
✅ Data stays in sync with Supabase

---

**Ready to implement?** Follow the steps above, starting with Phase 1 (core fields). Once that works, expand to Phase 2 and 3.

