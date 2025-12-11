# Customs Implementation Status

**Last Updated:** Current Session  
**Status:** In Progress - Ready for Make.com Testing

## Overview

This document tracks the implementation of EasyPost customs information for international shipments. The implementation is complete in the codebase and ready for Make.com workflow configuration.

## Problem Statement

EasyPost requires customs information for all international shipments. Without it, the "Buy a Shipment" step in Make.com fails with a `400 Bad Request` error. This was discovered when testing UK addresses (and other international destinations).

## Solution Implemented

### 1. Customs Info Structure

Customs information has been added to the webhook payload in `api/webhook.js` with **two approaches** to support different Make.com workflow configurations:

#### Approach 1: Nested in Shipment (Direct)
- **Location:** `automationData.easypost_shipment.customs_info`
- **Use Case:** If Make.com's "Create a Shipment" module supports nested customs info
- **Structure:** Complete `customs_info` object with all fields including `customs_items` array

#### Approach 2: Separate Modules (Recommended)
- **Location:** 
  - `automationData.customs_items` - Array for looping
  - `automationData.customs_info_metadata` - Metadata object
- **Use Case:** Make.com workflow with separate "Create CustomsItem" and "Create CustomsInfo" modules
- **Workflow:**
  1. Loop through `customs_items` to create CustomsItem objects
  2. Create CustomsInfo using `customs_info_metadata` + CustomsItem IDs
  3. Create Shipment referencing CustomsInfo ID
  4. Buy Shipment using shipment ID

### 2. Customs Data Structure

#### CustomsInfo Fields (for `customs_info_metadata` or nested `customs_info`):
```javascript
{
  contents_type: 'documents',              // IDP is a document
  contents_explanation: 'International Driving Permit (IDP) document',
  customs_certify: true,                   // Boolean - certifies accuracy
  customs_signer: 'FastIDP',               // Name of certifying party
  restriction_type: 'none',                // No special restrictions
  restriction_comments: '',                 // Empty when restriction_type is 'none'
  non_delivery_option: 'return',            // Return if undeliverable
  eel_pfc: 'NOEEI 30.37(a)'                // EEL code for shipments < $2,500
}
```

#### CustomsItem Fields (for `customs_items` array):
```javascript
{
  description: 'International Driving Permit',
  quantity: 1,
  value: 0.01,                              // Minimal value for documents (US dollars)
  weight: 8,                                // Weight in ounces (0.5 lb = 8 oz)
  hs_tariff_number: '49019900',             // HS code for printed documents
  origin_country: 'US'                      // Where item was manufactured
}
```

### 3. Conditional Inclusion

All customs-related fields are **only included** when:
- `formData.shippingCategory === 'international'`
- For domestic/military shipments: `customs_info`, `customs_items`, and `customs_info_metadata` are all `null`

## Code Location

**File:** `api/webhook.js`

**Key Sections:**
- Lines ~1204-1217: Documentation comments explaining customs info mapping
- Lines ~1363-1384: `customs_info` nested in `easypost_shipment` object
- Lines ~1394-1417: Top-level `customs_items` array and `customs_info_metadata` object

## Make.com Configuration Guide

### Option A: Using Nested Customs Info (Simpler)

1. **Create a Shipment** module:
   - Map all standard fields (from_address, to_address, parcel)
   - Map `customs_info` from: `easypost_shipment.customs_info`
   - EasyPost will handle customs automatically

2. **Buy a Shipment** module:
   - Use shipment ID from previous step
   - Select international carrier service

### Option B: Using Separate Modules (More Control)

1. **Create CustomsItem** module (in a loop):
   - **Loop through:** `automationData.customs_items`
   - **Map fields:**
     - Description: `description`
     - Quantity: `quantity`
     - Value: `value` (in US dollars)
     - Weight: `weight` (in ounces)
     - HS Tariff Number: `hs_tariff_number`
     - Origin Country: `origin_country`
   - **Output:** CustomsItem ID (store in array)

2. **Create CustomsInfo** module:
   - **Map fields from:** `automationData.customs_info_metadata`
     - Contents Type: `contents_type`
     - Contents Explanation: `contents_explanation`
     - Customs Certify: `customs_certify`
     - Customs Signer: `customs_signer`
     - Restriction Type: `restriction_type`
     - Restriction Comments: `restriction_comments`
     - Non-Delivery Option: `non_delivery_option`
     - EEL/PFC: `eel_pfc`
   - **Customs Items:** Reference the CustomsItem IDs from step 1
   - **Output:** CustomsInfo ID

3. **Create a Shipment** module:
   - Map all standard fields (from_address, to_address, parcel)
   - **Customs Info:** Reference the CustomsInfo ID from step 2
   - **Output:** Shipment ID

4. **Buy a Shipment** module:
   - Use shipment ID from step 3
   - Select international carrier service (e.g., "USPS First Class International", "Asendia via EasyPost")

## Testing Checklist

- [ ] Test UK address (150 Piccadilly, London W1J 9BR, United Kingdom)
- [ ] Test other international automated countries (CA, AU, etc.)
- [ ] Verify customs info is included in webhook payload for international
- [ ] Verify customs info is null/omitted for domestic shipments
- [ ] Verify customs info is null/omitted for military shipments
- [ ] Test Make.com workflow with chosen approach (A or B)
- [ ] Verify "Buy a Shipment" step succeeds for international addresses
- [ ] Verify customs forms are generated correctly by EasyPost

## Related Documentation

- [EasyPost Customs Guide](https://docs.easypost.com/guides/customs-guide)
- [EasyPost Customs Support Article](https://support.easypost.com/hc/en-us/articles/360042847751-Customs-Shipping-Internationally)
- [EasyPost CustomsInfo Object Reference](https://docs.easypost.com/docs/customs-infos)
- [EasyPost CustomsItem Object Reference](https://docs.easypost.com/docs/customs-items)

## Previous Issues Resolved

1. ✅ **Database Error:** "value too long for type character varying(2)" for `shipping_country`
   - **Solution:** Implemented `normalizeCountryCode()` to convert full country names to 2-character ISO codes

2. ✅ **Fulfillment Type Mismatch:** "United Kingdom" triggered "manual" instead of "automated"
   - **Solution:** Normalize country code before checking against `AUTOMATED_COUNTRIES` list

3. ✅ **Missing Shipping Details:** Shipping details not visible in webhook data
   - **Solution:** Enhanced address parsing and prioritization logic

4. ✅ **State Field Issue:** Make.com static mapping required `state` field to exist
   - **Solution:** `shipping_address.state` always includes state (empty string for countries without states), while `easypost_shipment.to_address.state` is conditionally omitted for EasyPost API

5. ✅ **EasyPost 400 Error:** "Buy a Shipment" failing for international addresses
   - **Solution:** Added comprehensive customs information (this implementation)

## Next Steps

1. **Configure Make.com Workflow:**
   - Choose between Approach A (nested) or Approach B (separate modules)
   - Set up the EasyPost modules according to chosen approach
   - Map all required fields from webhook payload

2. **Test International Shipments:**
   - Test with UK address first (known issue case)
   - Test with other automated international countries
   - Verify customs forms are generated correctly

3. **Monitor and Debug:**
   - Check Make.com execution logs for any errors
   - Verify EasyPost shipment creation succeeds
   - Confirm customs forms are attached to labels

## Technical Notes

### HS Tariff Number
- Current value: `'49019900'` (HS code for printed documents)
- Source: Harmonized System classification
- Can be verified/updated at: https://hts.usitc.gov

### EEL/PFC Code
- Current value: `'NOEEI 30.37(a)'`
- Used for: Shipments valued under $2,500
- For shipments over $2,500: Would need AES ITN (not applicable for IDP documents)

### Weight and Value
- Weight: 8 oz (0.5 lb) - matches parcel weight
- Value: $0.01 - minimal value for documents (low/no commercial value)

### Country Code Normalization
- All country codes are normalized to 2-character ISO codes using `normalizeCountryCode()`
- Function located in `api/save-application.js` and imported in `api/webhook.js`
- Handles: "United Kingdom" → "GB", "United States" → "US", etc.

## Questions to Resolve

1. **Make.com Module Support:** Does Make.com's "Create a Shipment" module support nested `customs_info`, or do we need to use separate modules?
2. **HS Tariff Number Verification:** Should we verify the HS code `49019900` is correct for IDP documents?
3. **Carrier Selection:** Which EasyPost carrier services support international shipping for our use case?
4. **Testing:** What other international addresses should we test beyond the UK?

---

**Status:** Implementation complete in code. Ready for Make.com configuration and testing.

