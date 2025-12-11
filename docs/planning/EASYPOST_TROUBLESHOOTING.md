# EasyPost Module Troubleshooting

## Issue: Missing Parcel Parameters (weight, length, width, height)

### Problem
Make.com EasyPost module shows error:
```
BundleValidationError: Validation failed for 4 parameter(s).
- Missing value of required parameter 'weight'
- Missing value of required parameter 'length'
- Missing value of required parameter 'width'
- Missing value of required parameter 'height'
```

### Root Cause
The data IS being sent in the webhook payload, but Make.com's EasyPost module can't find it at the expected path.

### Solution

#### Step 1: Verify Webhook Data Structure

The webhook sends parcel data in this structure:
```json
{
  "easypost_shipment": {
    "parcel": {
      "weight": 8,
      "length": 4,
      "width": 6,
      "height": 0.1
    }
  }
}
```

#### Step 2: Check Make.com Data Mapping

In your Make.com scenario, the EasyPost module should reference:

**If webhook is Step 4:**
- Weight: `{{4.easypost_shipment.parcel.weight}}`
- Length: `{{4.easypost_shipment.parcel.length}}`
- Width: `{{4.easypost_shipment.parcel.width}}`
- Height: `{{4.easypost_shipment.parcel.height}}`

**If webhook is Step 1:**
- Weight: `{{1.easypost_shipment.parcel.weight}}`
- Length: `{{1.easypost_shipment.parcel.length}}`
- Width: `{{1.easypost_shipment.parcel.width}}`
- Height: `{{1.easypost_shipment.parcel.height}}`

#### Step 3: Verify Webhook Deployment

**Important:** The webhook code must be deployed to Vercel for changes to take effect.

1. Check if code is deployed:
   ```bash
   # Check Vercel deployment status
   vercel --prod
   ```

2. Or check Vercel dashboard for latest deployment

3. Test webhook manually:
   - Complete a test application
   - Check Make.com execution log
   - View the webhook data received (click on webhook module)
   - Verify `easypost_shipment.parcel` exists in the data

#### Step 4: Refresh Make.com Data Mapping

1. In Make.com scenario, click on the **webhook trigger module**
2. Click "Run once" or wait for new webhook
3. Click on **EasyPost module**
4. Click the data mapper icon next to each field
5. Navigate to: `easypost_shipment` → `parcel` → select field
6. Save the module

#### Step 5: Alternative - Use Direct Values

If the nested path doesn't work, you can use direct values in Make.com:

- Weight: `8` (hardcoded)
- Length: `4` (hardcoded)
- Width: `6` (hardcoded)
- Height: `0.1` (hardcoded)

**Note:** This works because the parcel dimensions are always the same for IDP documents.

### Quick Fix (Temporary)

If you need it working immediately, use hardcoded values in Make.com EasyPost module:

1. Open EasyPost module
2. For each field (weight, length, width, height), enter the value directly:
   - Weight: `8`
   - Length: `4`
   - Width: `6`
   - Height: `0.1`
3. Save and test

This will work because IDP documents always have the same dimensions.

### Permanent Fix

1. **Deploy webhook to Vercel** (if not already deployed)
2. **Refresh Make.com data mapping:**
   - Open webhook module
   - View latest execution data
   - Verify `easypost_shipment.parcel` structure exists
   - Update EasyPost module to use correct paths
3. **Test with new application**

### Verification

To verify the webhook is sending correct data:

1. In Make.com, go to your scenario
2. Click on the webhook trigger (step 4 or step 1)
3. Click "Run once" or view latest execution
4. Expand the data received
5. Look for `easypost_shipment.parcel` object
6. Verify it contains: `weight`, `length`, `width`, `height`

### Expected Data Structure

When you expand the webhook data in Make.com, you should see:

```
easypost_shipment
  ├── to_address
  │   ├── name
  │   ├── street1
  │   ├── city
  │   └── ...
  ├── parcel          ← This is what EasyPost module needs
  │   ├── weight: 8
  │   ├── length: 4
  │   ├── width: 6
  │   └── height: 0.1
  ├── max_delivery_days
  └── carrier
```

### Common Issues

1. **Webhook not deployed:** Code changes only take effect after Vercel deployment
2. **Wrong step number:** Check which step your webhook is (1, 4, etc.)
3. **Data path typo:** Make sure path is exactly `{{X.easypost_shipment.parcel.weight}}`
4. **JSON parsing:** Make.com might need to refresh to see new data structure

### Still Not Working?

1. Check Vercel function logs for webhook execution
2. Check Make.com execution logs for errors
3. Manually inspect webhook payload in Make.com
4. Try hardcoded values as temporary fix
5. Verify webhook URL is correct: `https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b`

---

**Note:** The code structure is correct. The issue is in Make.com's data mapping or webhook deployment status.



