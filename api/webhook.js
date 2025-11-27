import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Disable Vercel's default body parsing to get raw body for Stripe webhooks
export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper function to read raw body from request
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      const buffer = Buffer.concat(chunks)
      resolve(buffer)
    })
    req.on('error', reject)
  })
}

// Use the same Stripe key as other files
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey)

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  
  console.log(`Webhook request: ${req.method} from origin: ${req.headers.origin}`)
  
  // Enhanced CORS configuration for Framer domain
  // Previous URL (rollback): 'https://ambiguous-methodologies-053772.framer.app'
  const allowedOrigins = [
    'https://serious-flows-972417.framer.app',
    'http://localhost:3000', // For local development
    'https://localhost:3000'
  ]
  
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    console.log(`CORS origin allowed: ${origin}`)
  } else {
    console.log(`CORS origin NOT in allowlist: ${origin}`)
    console.log(`Allowed origins:`, allowedOrigins)
    // Always allow the main Framer domain
    res.setHeader('Access-Control-Allow-Origin', 'https://serious-flows-972417.framer.app')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, stripe-signature')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request from:', origin)
    return res.status(200).end()
  }

  // Only allow POST requests for actual webhook calls
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Get raw body for Stripe webhook signature verification
  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']
  
  let event

  try {
    if (sig) {
      // This is a real Stripe webhook with signature - use raw body buffer
      event = stripe.webhooks.constructEvent(
        rawBody, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } else {
      // This is a manual call from frontend (no signature) - parse as JSON
      try {
        event = JSON.parse(rawBody.toString())
      } catch (parseError) {
        console.error('Failed to parse request body as JSON:', parseError.message)
        return res.status(400).json({ error: 'Invalid JSON in request body' })
      }
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle the event
  try {
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object)
        break
      
      default:
    }

    res.status(200).json({ received: true, eventType: event.type })
  } catch (error) {
    console.error('=== WEBHOOK HANDLER ERROR ===')
    console.error('Error details:', error)
    console.error('Stack trace:', error.stack)
    
    // Ensure CORS headers are set even in error responses
    // Previous URL (rollback): 'https://ambiguous-methodologies-053772.framer.app'
    res.setHeader('Access-Control-Allow-Origin', 'https://serious-flows-972417.framer.app')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    
    res.status(500).json({ error: 'Webhook handler failed', details: error.message })
  }
}

// Handle successful checkout completion
async function handleCheckoutCompleted(session) {
  
  // Update application with payment success using Supabase
  const { data, error } = await supabase
    .from('applications')
    .update({
      payment_status: 'completed',
      stripe_payment_intent_id: session.payment_intent,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', session.id)
    .select('application_id, form_data, file_urls')
    .single()

  if (error) {
    console.error('Database update failed:', error)
    return
  }

  if (data) {
    // For checkout sessions, we don't have detailed address data like PaymentIntents
    // But we can still trigger the automation
    await triggerMakeAutomation(data.application_id, data.form_data, { 
      id: session.payment_intent,
      payment_method: session.payment_method,
      amount: session.amount_total,
      currency: session.currency 
    }, null, data.file_urls)
    
  } else {
    console.error('No application found for session:', session.id)
  }
}

// Handle payment intent success (for embedded payments)
async function handlePaymentSucceeded(paymentIntentData) {
  
  // If this is a simplified object from frontend, fetch the full PaymentIntent
  let paymentIntent = paymentIntentData
  console.log('=== PAYMENT INTENT DEBUG ===')
  console.log('Initial paymentIntentData:', JSON.stringify(paymentIntentData, null, 2))
  
  if (!paymentIntent.amount || !paymentIntent.payment_method) {
    console.log('Fetching full PaymentIntent from Stripe...')
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentData.id, {
        expand: ['payment_method']
      })
      console.log('Retrieved PaymentIntent metadata:', JSON.stringify(paymentIntent.metadata, null, 2))
    } catch (error) {
      console.error('Failed to retrieve PaymentIntent:', error)
      return
    }
  }
  
  const applicationId = paymentIntent.metadata?.applicationId || paymentIntent.metadata?.application_id
  console.log('Extracted applicationId:', applicationId)
  console.log('=== END PAYMENT INTENT DEBUG ===')
  
  if (!applicationId) {
    console.error('No application ID in payment intent metadata')
    console.error('Available metadata keys:', Object.keys(paymentIntent.metadata || {}))
    return
  }


  // First, let's check if the application exists at all
  const { data: checkData, error: checkError } = await supabase
    .from('applications')
    .select('application_id, payment_status')
    .eq('application_id', applicationId)
    .single()
  

  // Get the payment method to extract address details
  let paymentMethod = null
  let shippingAddress = null
  
  try {
    if (paymentIntent.payment_method) {
      if (typeof paymentIntent.payment_method === 'string') {
        paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
      } else {
        paymentMethod = paymentIntent.payment_method
      }
    }
    
    // Check if there's shipping information in the payment intent
    if (paymentIntent.shipping) {
      shippingAddress = paymentIntent.shipping.address
    }
  } catch (error) {
    console.error('Failed to retrieve payment method details:', error)
  }

  // Update application with payment success and address data
  const addressData = {
    billing_address: paymentMethod?.billing_details?.address || null,
    billing_name: paymentMethod?.billing_details?.name || null,
    billing_email: paymentMethod?.billing_details?.email || null,
    billing_phone: paymentMethod?.billing_details?.phone || null,
    shipping_address: shippingAddress || null,
    shipping_name: paymentIntent.shipping?.name || null,
    shipping_phone: paymentIntent.shipping?.phone || null,
  }


  const { data, error } = await supabase
    .from('applications')
    .update({
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_payment_method_id: paymentIntent.payment_method,
      payment_completed_at: new Date().toISOString(),
      billing_address: JSON.stringify(addressData.billing_address),
      billing_name: addressData.billing_name,
      billing_email: addressData.billing_email,
      billing_phone: addressData.billing_phone,
      shipping_address: JSON.stringify(addressData.shipping_address),
      shipping_name: addressData.shipping_name,
      shipping_phone: addressData.shipping_phone,
      updated_at: new Date().toISOString()
    })
    .eq('application_id', applicationId)
    .select('application_id, form_data, file_urls')
    .single()


  if (error) {
    console.error('Database update failed:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return
  }

  if (data) {
    // Trigger Make.com automation with payment intent and address data
    await triggerMakeAutomation(data.application_id, data.form_data, paymentIntent, addressData, data.file_urls)
    
  } else {
    console.error('No application found for payment intent:', paymentIntent.id)
  }
}

// Handle expired checkout sessions
async function handleCheckoutExpired(session) {
  
  // Update application status to expired using Supabase
  const { error } = await supabase
    .from('applications')
    .update({
      payment_status: 'expired',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', session.id)

  if (error) {
    console.error('Failed to mark session as expired:', error)
  } else {
  }
}

// Trigger Make.com automation with application data for business workflow
async function triggerMakeAutomation(applicationId, formDataString, paymentIntent, addressData = null, fileData = null) {
  
  try {
    // Parse form data
    const formData = typeof formDataString === 'string' 
      ? JSON.parse(formDataString) 
      : formDataString

    // Parse file URLs (new structure)
    const parsedFileData = fileData ? (typeof fileData === 'string' ? JSON.parse(fileData) : fileData) : null

    // Calculate processing time based on selection
    const getProcessingTime = (option) => {
      switch (option) {
        case 'standard':
          return '3-5 business days'
        case 'fast':
          return '1-2 business days'
        case 'fastest':
          return 'Same-day/Next-day (if received before 12pm ET)'
        default:
          return '3-5 business days'
      }
    }

    // Get delivery details (backend note) based on speed
    const getDeliveryDetails = (speed) => {
      const details = {
        'standard': '3-5 business days processing & standard shipping',
        'fast': '1-2 business days processing & expedited shipping',
        'fastest': 'Same-day processing & overnight shipping'
      }
      return details[speed] || details.standard
    }

    // Get delivery estimate (customer-facing) based on speed and category
    const getDeliveryEstimate = (speed, category) => {
      if (category === 'domestic') {
        if (speed === 'standard') return 'Arrives in 6-8 business days - longer for US Territories'
        if (speed === 'fast') return 'Arrives in 3-4 business days - longer for US Territories'
        if (speed === 'fastest') return 'Arrives the next business day (or in 2 bus. days if application is received after noon ET - longer for US territories'
      } else if (category === 'international') {
        if (speed === 'standard') return 'Arrives in 7-10 business days'
        if (speed === 'fast') return 'Arrives in 4-7 business days'
        if (speed === 'fastest') return 'Processing by noon ET. Arrives in 2-5 business days - contact us for your location\'s shipping timeline'
      } else if (category === 'military') {
        if (speed === 'standard') return 'Arrives in 8-15 business days'
        if (speed === 'fast') return 'Arrives in 6-12 business days'
        if (speed === 'fastest') return 'Arrives in 5-11 business days'
      }
      return 'Delivery estimate unavailable'
    }

    // Calculate shipping speed requirement for EasyPost (in days)
    const getShippingSpeedDays = (option, category) => {
      if (category === 'military') {
        if (option === 'standard') return 15
        if (option === 'fast') return 12
        if (option === 'fastest') return 11
        return 15
      }
      
      if (category === 'international') {
        if (option === 'standard') return 10
        if (option === 'fast') return 7
        if (option === 'fastest') return 5
        return 10
      }
      
      // Domestic
      if (option === 'standard') return 8
      if (option === 'fast') return 4
      if (option === 'fastest') return 2
      return 8
    }

    // Determine carrier based on shipping category
    const getCarrier = (category) => {
      if (category === 'military') {
        return 'USPS' // Only USPS can deliver to military bases
      }
      return null // Let EasyPost choose best carrier for domestic/international
    }

    // Prepare comprehensive data for Make.com business workflow
    const automationData = {
      // Application identification
      application_id: applicationId,
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      amount_total: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      
      // Tax information
      tax_details: {
        tax_rate: 0.0775,
        tax_jurisdiction: 'Bellefontaine, OH',
        subtotal: (paymentIntent.amount / 100) / 1.0775, // Calculate pre-tax amount
        tax_amount: (paymentIntent.amount / 100) - ((paymentIntent.amount / 100) / 1.0775)
      },
      
      // Customer personal information (for work order)
      customer: {
        first_name: formData.firstName,
        middle_name: formData.middleName || '',
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.middleName || ''} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        signature_url: parsedFileData?.signature?.publicUrl || null, // Signature URL from storage
        signature_email_url: parsedFileData?.signature?.publicUrl ? `${parsedFileData.signature.publicUrl}?width=400&height=200&resize=contain&format=png` : null // Optimized for email
      },
    
      // License information
      license_info: {
        license_number: formData.licenseNumber,
        license_state: formData.licenseState,
        license_expiration: formData.licenseExpiration,
        birthplace_city: formData.birthplaceCity,
        birthplace_state: formData.birthplaceState
      },
      
      // Travel information
      travel_info: {
        drive_abroad: formData.driveAbroad,
        departure_date: formData.departureDate,
        permit_effective_date: formData.permitEffectiveDate
      },
      
      // Form address (step 1)
      form_address: {
        street_address: formData.streetAddress,
        street_address_2: formData.streetAddress2,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode
      },
      
      // Shipping address from Stripe (step 4)
      shipping_address: addressData?.shipping_address ? {
        name: addressData.shipping_name || `${formData.firstName} ${formData.lastName}`,
        phone: addressData.shipping_phone || formData.phone,
        line1: addressData.shipping_address.line1,
        line2: addressData.shipping_address.line2 || '',
        city: addressData.shipping_address.city,
        state: addressData.shipping_address.state,
        postal_code: addressData.shipping_address.postal_code,
        country: addressData.shipping_address.country || 'US'
      } : {
        // Fallback to form data if no Stripe shipping address
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        line1: formData.streetAddress,
        line2: formData.streetAddress2 || '',
        city: formData.city,
        state: formData.state,
        postal_code: formData.zipCode,
        country: 'US'
      },
      
      // Application selections
      selections: {
        license_types: formData.licenseTypes || [],
        selected_permits: formData.selectedPermits || [],
        delivery_speed: formData.processingOption, // 'standard', 'fast', or 'fastest'
        shipping_category: formData.shippingCategory, // 'domestic', 'international', or 'military'
        delivery_details: getDeliveryDetails(formData.processingOption), // Backend processing note
        estimated_delivery: getDeliveryEstimate(formData.processingOption, formData.shippingCategory), // Customer delivery estimate
        processing_time_estimate: getProcessingTime(formData.processingOption) // Legacy field for compatibility
      },
      
      // International shipping details (when applicable)
      international_shipping: formData.shippingCategory === 'international' ? {
        country: formData.shippingCountry,
        pccc_code: formData.pcccCode || null,
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone,
        full_address: formData.internationalFullAddress,
        local_address: formData.internationalLocalAddress || null,
        delivery_instructions: formData.internationalDeliveryInstructions || null
      } : null,
      
      // Customer uploaded files (URLs from Supabase Storage)
      customer_files: {
        id_document_urls: parsedFileData?.driversLicense?.map(file => ({
          url: file.publicUrl,
          fileName: file.fileName,
          originalName: file.originalName,
          // Add image transformation parameters for email attachments
          emailUrl: `${file.publicUrl}?width=800&height=600&resize=contain&format=webp`,
          thumbnailUrl: `${file.publicUrl}?width=200&height=200&resize=cover&format=webp`
        })) || [],
        passport_photo_urls: parsedFileData?.passportPhoto?.map(file => ({
          url: file.publicUrl,
          fileName: file.fileName,
          originalName: file.originalName,
          // Add image transformation parameters for email attachments
          emailUrl: `${file.publicUrl}?width=800&height=600&resize=contain&format=webp`,
          thumbnailUrl: `${file.publicUrl}?width=200&height=200&resize=cover&format=webp`
        })) || [],
        
        // Flattened fields for Make.com (just the first 5)
        id_document_url_1: parsedFileData?.driversLicense?.[0]?.publicUrl || null,
        id_document_url_2: parsedFileData?.driversLicense?.[1]?.publicUrl || null,
        id_document_url_3: parsedFileData?.driversLicense?.[2]?.publicUrl || null,
        id_document_url_4: parsedFileData?.driversLicense?.[3]?.publicUrl || null,
        id_document_url_5: parsedFileData?.driversLicense?.[4]?.publicUrl || null,
        
        passport_photo_url_1: parsedFileData?.passportPhoto?.[0]?.publicUrl || null,
        passport_photo_url_2: parsedFileData?.passportPhoto?.[1]?.publicUrl || null,
        passport_photo_url_3: parsedFileData?.passportPhoto?.[2]?.publicUrl || null,
        passport_photo_url_4: parsedFileData?.passportPhoto?.[3]?.publicUrl || null,
        passport_photo_url_5: parsedFileData?.passportPhoto?.[4]?.publicUrl || null,
        
        // Legacy fields for backward compatibility (first file URLs)
        id_document_url: parsedFileData?.driversLicense?.[0]?.publicUrl || null,
        passport_photo_url: parsedFileData?.passportPhoto?.[0]?.publicUrl || null,
        signature_url: parsedFileData?.signature?.publicUrl || null,
        // Signature with transformation for email
        signature_email_url: parsedFileData?.signature?.publicUrl ? `${parsedFileData.signature.publicUrl}?width=400&height=200&resize=contain&format=png` : null,
        // File naming convention for Make.com to use
        id_document_filename: `${formData.firstName}${formData.lastName}_ID_Document.jpg`,
        passport_photo_filename: `${formData.firstName}${formData.lastName}_Passport_Photo.jpg`,
        signature_filename: `${formData.firstName}${formData.lastName}_Signature.png`
      },
      
      // EasyPost shipping data (for fastest rate selection)
      easypost_shipment: {
        to_address: {
          name: addressData?.shipping_name || `${formData.firstName} ${formData.lastName}`,
          street1: addressData?.shipping_address?.line1 || formData.streetAddress,
          street2: addressData?.shipping_address?.line2 || formData.streetAddress2 || '',
          city: addressData?.shipping_address?.city || formData.city,
          state: addressData?.shipping_address?.state || formData.state,
          zip: addressData?.shipping_address?.postal_code || formData.zipCode,
          country: addressData?.shipping_address?.country || 'US',
          phone: addressData?.shipping_phone || formData.phone,
          email: formData.email
        },
        parcel: {
          length: 4,    // IDP document size
          width: 6,
          height: 0.1,
          weight: 8     // 0.5 lb = 8 oz for IDP document
        },
        // Speed requirement for EasyPost to filter rates
        max_delivery_days: getShippingSpeedDays(formData.processingOption, formData.shippingCategory),
        // Carrier specification (USPS required for military)
        carrier: getCarrier(formData.shippingCategory),
        options: {
          label_format: 'PDF',
          label_size: '4x6'
        }
      },
      
      // Business workflow settings
      business_settings: {
        work_order_recipient: 'wilke.gabe1@gmail.com',
        customer_thank_you_email: true,
        store_pdfs_in_supabase: true,
        processing_time_message: getProcessingTime(formData.processingOption)
      },
      
      // Timestamps
      timestamps: {
        created_at: new Date().toISOString(),
        payment_completed_at: new Date().toISOString()
      }
    }

    // Send to Make.com webhook (permanent URL)
    const makeWebhookUrl = 'https://hook.us2.make.com/ug16tj9ocleg8u1vz2qdltztx779wf4b'
    
    if (makeWebhookUrl) {
      
      const response = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(automationData)
      })
      
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Make.com webhook failed:', response.status, errorText)
        throw new Error(`Make.com webhook failed: ${response.status} ${errorText}`)
      }
      
      const responseText = await response.text()
      
      
      // Update database to track automation trigger
      await supabase
        .from('applications')
        .update({
          make_automation_triggered_at: new Date().toISOString(),
          make_automation_status: 'processing'
        })
        .eq('application_id', applicationId)
        
    } else {
    }

  } catch (error) {
    console.error('Failed to trigger Make.com business workflow:', error)
    
    // Update database with error status
    try {
      const { error: dbError } = await supabase
        .from('applications')
        .update({
          make_automation_status: 'failed',
          make_automation_error: error.message
        })
        .eq('application_id', applicationId)
      
      if (dbError) {
        console.error('Failed to update automation status:', dbError)
      }
    } catch (dbUpdateError) {
      console.error('Failed to update automation status:', dbUpdateError)
    }
  }
}
