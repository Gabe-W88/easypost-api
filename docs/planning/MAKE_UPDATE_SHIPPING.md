# Make.com → Supabase Shipping Update Integration

## Overview

After Make.com processes an order (creates shipping label, gets tracking number, etc.), it should call this endpoint to update the Supabase database with shipping and tracking information.

## Endpoint

**URL:** `https://easypost-api.vercel.app/api/update-shipping`  
**Method:** `POST`  
**Content-Type:** `application/json`

## Required Field

- `application_id` - The application ID (e.g., `APP-1765502063438-4ax5pxjyd`)

## Optional Fields (All shipping/tracking data)

All other fields are optional. Only send the fields you have data for.

### Tracking Information
- `tracking_number` - Main tracking number (string)
- `tracking_code` - Alternative tracking code (string)
- `tracking_url` - URL to track the shipment (string)

### EasyPost Shipment Data
- `easypost_shipment_id` - EasyPost shipment ID (string)
- `shipping_carrier` - Carrier name (e.g., "USPS", "FedEx", "UPS") (string)
- `shipping_service` - Service level (e.g., "Priority Mail", "First Class") (string)
- `shipping_cost` - Shipping cost in dollars (number or string that can be parsed to float)

### Delivery Information
- `estimated_delivery_date` - Expected delivery date (YYYY-MM-DD format string)

### Label URLs
- `shipping_label_url` - URL to view shipping label (string)
- `shipping_label_pdf_url` - URL to download PDF label (string)
- `work_order_pdf_url` - URL to work order PDF (string)

### Status Flags
- `shipping_label_generated` - Boolean (true/false) - Whether label was successfully generated
- `make_automation_status` - Status string (e.g., "completed", "failed", "processing")
- `make_automation_error` - Error message if automation failed (string)

## Example Payload

### Minimal Update (Just Tracking Number)
```json
{
  "application_id": "APP-1765502063438-4ax5pxjyd",
  "tracking_number": "9400111899223197428490"
}
```

### Full Update (All Available Data)
```json
{
  "application_id": "APP-1765502063438-4ax5pxjyd",
  "tracking_number": "9400111899223197428490",
  "tracking_code": "9400111899223197428490",
  "tracking_url": "https://tools.usps.com/go/TrackConfirmAction?tLabels=9400111899223197428490",
  "easypost_shipment_id": "shp_1234567890",
  "shipping_carrier": "USPS",
  "shipping_service": "Priority Mail",
  "shipping_cost": 8.50,
  "estimated_delivery_date": "2025-12-18",
  "shipping_label_url": "https://easypost-files.s3-us-west-2.amazonaws.com/files/label/...",
  "shipping_label_pdf_url": "https://easypost-files.s3-us-west-2.amazonaws.com/files/label/....pdf",
  "work_order_pdf_url": "https://example.com/work-orders/APP-1765502063438-4ax5pxjyd.pdf",
  "shipping_label_generated": true,
  "make_automation_status": "completed"
}
```

### Error Update
```json
{
  "application_id": "APP-1765502063438-4ax5pxjyd",
  "make_automation_status": "failed",
  "make_automation_error": "EasyPost API error: Invalid address"
}
```

## Make.com Setup Instructions

### Step 1: Add HTTP Module
In your Make.com scenario, after the EasyPost "Buy a Shipment" step (or any step that generates shipping data), add an **HTTP > Make a request** module.

### Step 2: Configure HTTP Request
- **URL:** `https://easypost-api.vercel.app/api/update-shipping`
- **Method:** `POST`
- **Headers:**
  - `Content-Type`: `application/json`
- **Body Type:** `Raw`
- **Body Content:** JSON (see mapping below)

### Step 3: Map Data from EasyPost Response

Map the EasyPost response fields to the endpoint fields:

| Make.com Field | Endpoint Field | Source (EasyPost Response) |
|---------------|----------------|----------------------------|
| `application_id` | `application_id` | From original webhook: `application_id` |
| `tracking_number` | `tracking_number` | EasyPost: `tracking_code` |
| `tracking_code` | `tracking_code` | EasyPost: `tracking_code` |
| `tracking_url` | `tracking_url` | EasyPost: `tracker.public_url` or `tracker.tracking_details[0].tracking_location.city` |
| `easypost_shipment_id` | `easypost_shipment_id` | EasyPost: `id` |
| `shipping_carrier` | `shipping_carrier` | EasyPost: `selected_rate.carrier` |
| `shipping_service` | `shipping_service` | EasyPost: `selected_rate.service` |
| `shipping_cost` | `shipping_cost` | EasyPost: `selected_rate.rate` (convert from cents: divide by 100) |
| `estimated_delivery_date` | `estimated_delivery_date` | EasyPost: `selected_rate.est_delivery_date` (format as YYYY-MM-DD) |
| `shipping_label_url` | `shipping_label_url` | EasyPost: `postage_label.label_url` |
| `shipping_label_pdf_url` | `shipping_label_pdf_url` | EasyPost: `postage_label.label_pdf_url` |
| `shipping_label_generated` | `shipping_label_generated` | Set to `true` if label exists |
| `make_automation_status` | `make_automation_status` | Set to `"completed"` on success |

### Step 4: Error Handling

Add error handling in Make.com:
- If EasyPost step fails, call the endpoint with:
  ```json
  {
    "application_id": "{{application_id}}",
    "make_automation_status": "failed",
    "make_automation_error": "{{error.message}}"
  }
  ```

## Response Format

### Success (200)
```json
{
  "success": true,
  "message": "Shipping data updated successfully",
  "application_id": "APP-1765502063438-4ax5pxjyd",
  "updated_fields": ["tracking_number", "shipping_carrier", "shipping_label_generated"]
}
```

### Error (400/404/500)
```json
{
  "error": "Application not found",
  "application_id": "APP-1765502063438-4ax5pxjyd"
}
```

## Database Columns Updated

The endpoint updates these columns in the `applications` table:

- `tracking_number`
- `tracking_code`
- `tracking_url`
- `easypost_shipment_id`
- `shipping_carrier`
- `shipping_service`
- `shipping_cost`
- `estimated_delivery_date`
- `shipping_label_url`
- `shipping_label_pdf_url`
- `work_order_pdf_url`
- `shipping_label_generated`
- `make_automation_status`
- `make_automation_error`
- `updated_at` (automatically set)

## Testing

You can test the endpoint using curl:

```bash
curl -X POST https://easypost-api.vercel.app/api/update-shipping \
  -H "Content-Type: application/json" \
  -d '{
    "application_id": "APP-1765502063438-4ax5pxjyd",
    "tracking_number": "9400111899223197428490",
    "shipping_carrier": "USPS",
    "shipping_label_generated": true
  }'
```

## Notes

- All fields except `application_id` are optional
- Only provided fields will be updated (null/undefined fields are ignored)
- The endpoint automatically sets `updated_at` timestamp
- The endpoint validates that the `application_id` exists before updating
- CORS is enabled, so Make.com can call it directly

