# Google Sheets Mapping Guide for Make.com

**Purpose:** Map webhook payload data to Google Sheets columns for automatic row addition when applications are submitted.

## Make.com Setup

1. **Trigger:** Webhook (receives data from `api/webhook.js`)
2. **Action:** Google Sheets → Add a Row
3. **Spreadsheet:** "Fast IDP Submissions Tracker - Dec 2025"
4. **Sheet:** "Sheet1"

## Field Mapping Reference

### Column A: Application #
**Webhook Path:** `application_id`  
**Type:** String  
**Example:** `"app_1234567890"`

---

### Column B: Date and time submitted
**Webhook Path:** `timestamps.created_at` or `timestamps.payment_completed_at`  
**Type:** ISO 8601 timestamp  
**Format:** `YYYY-MM-DDTHH:mm:ss.sssZ`  
**Make.com Transform:** Use `formatDate()` function to convert to desired format: `formatDate({{timestamps.created_at}}; "MM/DD/YYYY HH:mm:ss")`  
**Example:** `"2025-01-15T14:30:00.000Z"`

---

### Column C: Email address of applicant
**Webhook Path:** `customer.email`  
**Type:** String  
**Example:** `"john.doe@example.com"`

---

### Column D: Phone number of applicant
**Webhook Path:** `customer.phone`  
**Type:** String  
**Example:** `"+1234567890"`

---

### Column E: First name of applicant
**Webhook Path:** `customer.first_name`  
**Type:** String  
**Example:** `"John"`

---

### Column F: Middle name of applicant
**Webhook Path:** `customer.middle_name`  
**Type:** String (may be empty)  
**Example:** `"Michael"` or `""`

---

### Column G: Last name of applicant
**Webhook Path:** `customer.last_name`  
**Type:** String  
**Example:** `"Doe"`

---

### Column H: Date of birth
**Webhook Path:** `customer.date_of_birth`  
**Type:** String (MM/DD/YYYY format - already converted)  
**Note:** Already converted to MM/DD/YYYY in webhook  
**Example:** `"05/15/1990"`

---

### Column I: Driver's License Number
**Webhook Path:** `license_info.license_number`  
**Type:** String  
**Example:** `"D1234567"`

---

### Column J: State of Issue
**Webhook Path:** `license_info.license_state`  
**Type:** String (2-letter state code)  
**Example:** `"OH"`

---

### Column K: License Expiration Date
**Webhook Path:** `license_info.license_expiration`  
**Type:** String (YYYY-MM-DD format)  
**Make.com Transform:** Use `formatDate()` to convert to desired format  
**Example:** `"2026-12-31"`

---

### Column L: Street Address (of Driver's License)
**Webhook Path:** `form_address.street_address`  
**Type:** String  
**Example:** `"123 Main Street"`

---

### Column M: Street Address 2 (of Driver's License)
**Webhook Path:** `form_address.street_address_2`  
**Type:** String (may be empty)  
**Example:** `"Apt 4B"` or `""`

---

### Column N: City (of Driver's License)
**Webhook Path:** `form_address.city`  
**Type:** String  
**Example:** `"Columbus"`

---

### Column O: State (of Driver's License)
**Webhook Path:** `form_address.state`  
**Type:** String (2-letter state code)  
**Example:** `"OH"`

---

### Column P: Zip Code (of Driver's License)
**Webhook Path:** `form_address.zip_code`  
**Type:** String  
**Example:** `"43215"`

---

### Column Q: Passenger Car Endorsement? (Y/N)
**Webhook Path:** `selections.license_types` (check if array contains "passenger")  
**Type:** String ("Y" or "N")  
**Make.com Transform:** Use `if()` function: `if(contains(selections.license_types; "passenger"); "Y"; "N")`  
**Example:** `"Y"` or `"N"`

---

### Column R: Motorcycle Endorsement? (Y/N)
**Webhook Path:** `selections.license_types` (check if array contains "motorcycle")  
**Type:** String ("Y" or "N")  
**Make.com Transform:** Use `if()` function: `if(contains(selections.license_types; "motorcycle"); "Y"; "N")`  
**Example:** `"Y"` or `"N"`

---

### Column S: Commercial/Other Endorsement? (Y/N)
**Webhook Path:** `selections.license_types` (check if array contains "commercial" or "other")  
**Type:** String ("Y" or "N")  
**Make.com Transform:** Use `if()` function: `if(or(contains(selections.license_types; "commercial"); contains(selections.license_types; "other")); "Y"; "N")`  
**Example:** `"Y"` or `"N"`

---

### Column T: Brithplace City
**Webhook Path:** `license_info.birthplace_city`  
**Type:** String  
**Example:** `"Columbus"`

---

### Column U: Brithplace State/Country
**Webhook Path:** `license_info.birthplace_state`  
**Type:** String  
**Example:** `"OH"` or `"United Kingdom"`

---

### Column V: Where will you drive abroad
**Webhook Path:** `travel_info.drive_abroad`  
**Type:** String  
**Example:** `"France, Italy, Spain"`

---

### Column W: Departure date from USA
**Webhook Path:** `travel_info.departure_date`  
**Type:** String (MM/DD/YYYY format)  
**Note:** Already converted to MM/DD/YYYY in webhook  
**Example:** `"03/15/2025"`

---

### Column X: Permit Effective Date
**Webhook Path:** `travel_info.permit_effective_date`  
**Type:** String (MM/DD/YYYY format)  
**Note:** Already converted to MM/DD/YYYY in webhook  
**Example:** `"03/15/2025"`

---

### Column Y: Getting an IDP (Y/N)
**Webhook Path:** `selections.selected_permits` (check if array contains "idp")  
**Type:** String ("Y" or "N")  
**Make.com Transform:** Use `if()` function: `if(contains(selections.selected_permits; "idp"); "Y"; "N")`  
**Example:** `"Y"` or `"N"`

---

### Column Z: Getting an IADP (Y/N)
**Webhook Path:** `selections.selected_permits` (check if array contains "iadp")  
**Type:** String ("Y" or "N")  
**Make.com Transform:** Use `if()` function: `if(contains(selections.selected_permits; "iadp"); "Y"; "N")`  
**Example:** `"Y"` or `"N"`

---

### Columns AA-AF: Shipping Information Fields
**Note:** The CSV shows "(include columns for all the shipping information fields from the third page of the application - okay for them each to be on separate rows)" and some empty columns.

**Shipping Address Fields (Priority-based):**

#### For Domestic/Military:
- **Recipient Name:** `shipping_address_form_fields.recipient_name` or `shipping_address.name`
- **Recipient Phone:** `shipping_address_form_fields.recipient_phone` or `shipping_address.phone`
- **Street Address:** `shipping_address_form_fields.street_address` or `shipping_address.line1`
- **Street Address 2:** `shipping_address_form_fields.street_address_2` or `shipping_address.line2`
- **City:** `shipping_address_form_fields.city` or `shipping_address.city`
- **State:** `shipping_address_form_fields.state` or `shipping_address.state`
- **Postal Code:** `shipping_address_form_fields.postal_code` or `shipping_address.postal_code`
- **Country:** `shipping_address_form_fields.country` or `shipping_address.country`
- **Delivery Instructions:** `shipping_address_form_fields.delivery_instructions` or `""`

#### For International:
- **Recipient Name:** `shipping_address.name`
- **Recipient Phone:** `shipping_address.phone`
- **Full Address:** `shipping_address.full_address` or `international_shipping.full_address`
- **Local Address:** `shipping_address.local_address` or `international_shipping.local_address`
- **City:** `shipping_address.city`
- **State:** `shipping_address.state` (may be empty for countries without states)
- **Postal Code:** `shipping_address.postal_code`
- **Country:** `shipping_address.country` (2-letter code)
- **Delivery Instructions:** `shipping_address.delivery_instructions` or `international_shipping.delivery_instructions`
- **PCCC Code:** `international_shipping.pccc_code` (if applicable, e.g., for Korea)

---

### Column AG: Delivery location type selected (Domestic / International / Military)
**Webhook Path:** `selections.shipping_category`  
**Type:** String  
**Make.com Transform:** Capitalize first letter: `capitalize(selections.shipping_category)`  
**Values:** `"domestic"`, `"international"`, `"military"`  
**Example:** `"Domestic"`, `"International"`, `"Military"`

---

### Column AH: Delivery speed selected (standard / fast / fastest)
**Webhook Path:** `selections.delivery_speed`  
**Type:** String  
**Make.com Transform:** Capitalize first letter: `capitalize(selections.delivery_speed)`  
**Values:** `"standard"`, `"fast"`, `"fastest"`  
**Example:** `"Standard"`, `"Fast"`, `"Fastest"`

---

### Column AI: Transaction value ($)
**Webhook Path:** `amount_total`  
**Type:** Number (already in dollars, not cents)  
**Make.com Transform:** Format to 2 decimal places: `formatNumber({{amount_total}}; 2)`  
**Example:** `"49.99"`

---

### Column AJ: Shipping label autogenerated (y/n)
**Webhook Path:** `fulfillment_type`  
**Type:** String ("y" or "n")  
**Make.com Transform:** Use `if()` function: `if(equals(fulfillment_type; "automated"); "y"; "n")`  
**Example:** `"y"` or `"n"`

---

### Column AK: Automatic Tracking No.
**Webhook Path:** `easypost_shipment.tracking_code` (if available)  
**Type:** String (may be empty initially)  
**Note:** This may not be available until after shipment is created in Make.com  
**Example:** `"9400111899223197428490"` or `""`

---

### Column AL: Ship by date
**Webhook Path:** Calculated based on `selections.processing_time_estimate` and `timestamps.created_at`  
**Type:** Date  
**Note:** This needs to be calculated in Make.com based on processing time  
**Make.com Transform:** Add days to `timestamps.created_at` based on `selections.processing_time_estimate`:
- `"3-5 business days"` → Add 5 business days
- `"1-2 business days"` → Add 2 business days
- `"Same-day/Next-day"` → Add 1 business day

**Make.com Formula Example:**
```
if(contains({{selections.processing_time_estimate}}; "3-5"); addDays({{timestamps.created_at}}; 5); if(contains({{selections.processing_time_estimate}}; "1-2"); addDays({{timestamps.created_at}}; 2); addDays({{timestamps.created_at}}; 1)))
```

---

### Columns AM-AQ: Manual fields (to be filled by Jamie)
**Leave empty** - These are for manual entry:
- Reviewed and shipping label made if applicable
- Printed
- IDP obtained and shipped
- Follow-up email sent
- Notes (from Fast IDP)

---

## Make.com Configuration Steps

### Step 1: Set Up Webhook Trigger
1. Add "Webhook" module as trigger
2. Copy the webhook URL
3. Add this URL to your Make.com scenario

### Step 2: Add Google Sheets Module
1. Add "Google Sheets" → "Add a Row" module
2. Connect to your Google account
3. Select spreadsheet: "Fast IDP Submissions Tracker - Dec 2025"
4. Select sheet: "Sheet1"
5. Set "Table contains headers" to "Yes"

### Step 3: Map Fields
For each column in the "Values" section:

1. **Click the field** (e.g., "Application # (A)")
2. **Click the mapping icon** (usually `</>` or `{}`)
3. **Enter the webhook path** from the mapping above
4. **Apply transformations** if needed (see examples above)

### Step 4: Handle Array Fields
For fields that need array checking (license types, permits):

**Example for "Passenger Car Endorsement":**
```
if(contains({{selections.license_types}}; "passenger"); "Y"; "N")
```

**Example for "Getting an IDP":**
```
if(contains({{selections.selected_permits}}; "idp"); "Y"; "N")
```

### Step 5: Handle Date Formatting
For date fields, use Make.com's `formatDate()` function:

**Example for "Date and time submitted":**
```
formatDate({{timestamps.submitted_at}}; "MM/DD/YYYY HH:mm:ss")
```

### Step 6: Handle Conditional Shipping Address
Since shipping address structure varies by category, use Make.com's `if()` function:

**Example for "Shipping Street Address":**
```
if({{selections.shipping_category}} = "international"; {{shipping_address.line1}}; {{shipping_address_form_fields.street_address}})
```

---

## Troubleshooting

### Issue: Available values don't match spreadsheet columns
**Solution:** Make.com reads the spreadsheet headers. Ensure:
1. Headers are in row 1
2. "Table contains headers" is set to "Yes"
3. Refresh the module after updating headers

### Issue: Array fields not working
**Solution:** Use Make.com's `contains()` function to check array membership:
```
contains({{selections.license_types}}; "passenger")
```

### Issue: Date format incorrect
**Solution:** Use `formatDate()` function with desired format:
```
formatDate({{timestamps.submitted_at}}; "MM/DD/YYYY")
```

### Issue: Empty values for shipping address
**Solution:** Check the shipping category and use appropriate path:
- Domestic/Military: Use `shipping_address_form_fields.*`
- International: Use `shipping_address.*` or `international_shipping.*`

---

## Testing

1. **Test with a real submission:**
   - Submit a test application
   - Check Make.com execution log
   - Verify data appears correctly in Google Sheet

2. **Verify all fields:**
   - Check each column has correct data
   - Verify date formats
   - Verify Y/N fields are correct
   - Verify shipping address fields populate correctly

3. **Test edge cases:**
   - Application with middle name
   - Application without middle name
   - International shipping
   - Domestic shipping
   - Military shipping

---

## Additional Resources

- [Make.com Google Sheets Module Documentation](https://www.make.com/en/help/apps/google-sheets)
- [Make.com Functions Reference](https://www.make.com/en/help/functions)
- Webhook payload structure: See `api/webhook.js` → `triggerMakeAutomation()` function

---

**Last Updated:** Current Session  
**Status:** Ready for Make.com configuration

