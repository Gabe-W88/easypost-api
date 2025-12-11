# Google Sheets Setup Guide - Quick Reference

**Quick Setup:** Add Google Sheets to your existing Make.com scenario

---

## Prerequisites

- ✅ Make.com account with active scenario
- ✅ Google account with Sheets access
- ✅ Webhook already working (you have this)

---

## Step-by-Step Setup (5 minutes)

### 1. Create Google Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet: "FastIDP Applications"
3. Create header row (Row 1):

```
A1: Application ID
B1: Date Submitted
C1: Customer Name
D1: Email
E1: Phone
F1: Amount Paid
G1: Payment Status
H1: Shipping Category
I1: Processing Speed
J1: Fulfillment Type
K1: Stripe Payment ID
L1: License Number
M1: License State
N1: Shipping Address
O1: International Country
```

4. **Freeze Row 1** (View → Freeze → 1 row)
5. Save the spreadsheet

### 2. Update Make.com Scenario

1. Open your Make.com scenario
2. Find the webhook trigger (should be first module)
3. **Add new module** after webhook: "Google Sheets > Add a Row"

### 3. Configure Google Sheets Module

1. **Connection:**
   - Click "Create a connection"
   - Sign in with Google
   - Allow Make.com access
   - Select the spreadsheet: "FastIDP Applications"
   - Select worksheet: "Sheet1" (or your sheet name)

2. **Field Mapping:**
   - Map each field from webhook data to spreadsheet column

**Quick Mapping:**
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
Stripe Payment ID → {{1.stripe_payment_intent_id}}
License Number → {{1.license_info.license_number}}
License State → {{1.license_info.license_state}}
Shipping Address → {{1.shipping_address.line1}} {{1.shipping_address.city}}, {{1.shipping_address.state}} {{1.shipping_address.postal_code}}
International Country → {{1.international_shipping.country}}
```

3. **Save** the module

### 4. Test

1. **Run scenario once** (click "Run once")
2. Or complete a test application
3. Check Google Sheet - new row should appear
4. Verify data is correct

### 5. Activate Scenario

1. Toggle scenario to **Active**
2. New applications will automatically sync to Google Sheets

---

## Field Mapping Reference

### Basic Fields (Recommended)

| Spreadsheet Column | Make.com Data Path |
|-------------------|-------------------|
| Application ID | `{{1.application_id}}` |
| Date Submitted | `{{1.timestamps.created_at}}` |
| Customer Name | `{{1.customer.full_name}}` |
| Email | `{{1.customer.email}}` |
| Phone | `{{1.customer.phone}}` |
| Amount Paid | `{{1.amount_total}}` |
| Payment Status | `{{1.payment_status}}` |
| Shipping Category | `{{1.selections.shipping_category}}` |
| Processing Speed | `{{1.selections.delivery_speed}}` |

### Extended Fields (Optional)

| Spreadsheet Column | Make.com Data Path |
|-------------------|-------------------|
| First Name | `{{1.customer.first_name}}` |
| Last Name | `{{1.customer.last_name}}` |
| Date of Birth | `{{1.customer.date_of_birth}}` |
| License Number | `{{1.license_info.license_number}}` |
| License State | `{{1.license_info.license_state}}` |
| License Expiration | `{{1.license_info.license_expiration}}` |
| Shipping Name | `{{1.shipping_address.name}}` |
| Shipping Street | `{{1.shipping_address.line1}}` |
| Shipping City | `{{1.shipping_address.city}}` |
| Shipping State | `{{1.shipping_address.state}}` |
| Shipping ZIP | `{{1.shipping_address.postal_code}}` |
| Shipping Country | `{{1.shipping_address.country}}` |
| International Address | `{{1.international_shipping.full_address}}` |
| Selected Permits | `{{1.selections.selected_permits}}` |
| Stripe Payment ID | `{{1.stripe_payment_intent_id}}` |
| Tax Amount | `{{1.tax_details.tax_amount}}` |
| Subtotal | `{{1.tax_details.subtotal}}` |

### File URLs (Optional)

| Spreadsheet Column | Make.com Data Path |
|-------------------|-------------------|
| ID Document URL | `{{1.customer_files.id_document_url}}` |
| Passport Photo URL | `{{1.customer_files.passport_photo_url}}` |
| Signature URL | `{{1.customer_files.signature_url}}` |

---

## Advanced: Formatting & Formulas

### Add Date Formatting

In Google Sheets, add formula in Date Submitted column:
```
=DATEVALUE(LEFT(B2,10))
```
Then format as Date.

### Add Currency Formatting

Format Amount Paid column:
- Select column
- Format → Number → Currency

### Add Conditional Formatting

Highlight rows by status:
1. Select entire row
2. Format → Conditional formatting
3. Rule: "Payment Status = completed" → Green
4. Rule: "Payment Status = pending" → Yellow

### Add Summary Row

At the top, add formulas:
```
Total Applications: =COUNTA(A:A)-1
Total Revenue: =SUM(F:F)
Average Order: =AVERAGE(F:F)
```

---

## Troubleshooting

### Row Not Appearing

1. **Check Make.com execution:**
   - Go to Make.com → Scenarios → Executions
   - Check if Google Sheets module executed
   - Look for errors

2. **Check field mapping:**
   - Ensure all required fields are mapped
   - Check for typos in data paths

3. **Check Google Sheets permissions:**
   - Ensure Make.com has edit access
   - Re-authenticate if needed

### Wrong Data in Columns

1. **Verify data paths:**
   - Use Make.com data mapper to see available fields
   - Check nested object paths (e.g., `customer.full_name`)

2. **Test with one field:**
   - Start with just Application ID
   - Add fields one by one
   - Verify each works

### Duplicate Rows

1. **Check scenario:**
   - Ensure scenario only runs once per webhook
   - Don't have duplicate Google Sheets modules

2. **Add deduplication:**
   - Use "Google Sheets > Search Rows" before "Add Row"
   - Only add if Application ID doesn't exist

---

## Optional: Update Existing Rows

If you want to update rows instead of always adding:

1. Use "Google Sheets > Update a Row" module
2. Search by Application ID
3. Update matching row

**Note:** This is more complex - only needed if you want to update payment status changes.

---

## Optional: Sync Historical Data

To sync existing Supabase data to Google Sheets:

1. Export Supabase data to CSV
2. Import CSV to Google Sheets
3. Or create one-time Make.com scenario to read from Supabase and write to Sheets

---

## Maintenance

### Regular Checks

- ✅ Verify new applications appear in sheet
- ✅ Check data accuracy monthly
- ✅ Monitor Make.com execution logs

### Updates

- Add new columns as needed
- Update Make.com mapping when webhook payload changes
- Archive old data periodically

---

## Cost Considerations

- **Google Sheets:** Free (up to 10M cells)
- **Make.com:** Depends on your plan (webhook operations)
- **No additional code changes needed**

---

## Support

If you need help:
1. Check Make.com execution logs
2. Verify webhook payload structure
3. Test with single field first
4. Check Google Sheets permissions

---

**That's it!** Your Google Sheet will now automatically sync with every completed application.

