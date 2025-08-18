import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Use the same Stripe key as other files
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY
console.log('Webhook using Stripe key ending with:', stripeSecretKey ? stripeSecretKey.slice(-6) : 'MISSING')
const stripe = new Stripe(stripeSecretKey)

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Enable CORS for Framer domain
  res.setHeader('Access-Control-Allow-Origin', 'https://ambiguous-methodologies-053772.framer.app')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log('=== WEBHOOK CALLED ===')
  console.log('Request method:', req.method)
  console.log('Headers:', JSON.stringify(req.headers, null, 2))
  console.log('Body type:', typeof req.body)
  console.log('Body:', JSON.stringify(req.body, null, 2))

  const sig = req.headers['stripe-signature']
  let event

  try {
    if (sig) {
      // This is a real Stripe webhook with signature
      event = stripe.webhooks.constructEvent(
        req.body, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      )
    } else {
      // This is a manual call from frontend (no signature)
      console.log('Manual webhook call from frontend')
      event = req.body
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  // Handle the event
  try {
    console.log('=== WEBHOOK EVENT RECEIVED ===')
    console.log('Event type:', event.type)
    console.log('Event data:', JSON.stringify(event.data?.object, null, 2))
    
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('Handling checkout session completed')
        await handleCheckoutCompleted(event.data.object)
        break
      
      case 'payment_intent.succeeded':
        console.log('Handling payment intent succeeded')
        await handlePaymentSucceeded(event.data.object)
        break
      
      case 'checkout.session.expired':
        console.log('Handling checkout session expired')
        await handleCheckoutExpired(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===')
    res.status(200).json({ received: true, eventType: event.type })
  } catch (error) {
    console.error('=== WEBHOOK HANDLER ERROR ===')
    console.error('Error details:', error)
    console.error('Stack trace:', error.stack)
    res.status(500).json({ error: 'Webhook handler failed', details: error.message })
  }
}

// Handle successful checkout completion
async function handleCheckoutCompleted(session) {
  console.log('Checkout completed:', session.id)
  
  // Update application with payment success using Supabase
  const { data, error } = await supabase
    .from('applications')
    .update({
      payment_status: 'completed',
      stripe_payment_intent_id: session.payment_intent,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', session.id)
    .select('application_id, form_data')
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
    })
    
    console.log(`Application ${data.application_id} payment completed successfully`)
  } else {
    console.error('No application found for session:', session.id)
  }
}

// Handle payment intent success (for embedded payments)
async function handlePaymentSucceeded(paymentIntentData) {
  console.log('=== PAYMENT SUCCEEDED HANDLER START ===')
  console.log('Payment succeeded - Raw data:', JSON.stringify(paymentIntentData, null, 2))
  
  // If this is a simplified object from frontend, fetch the full PaymentIntent
  let paymentIntent = paymentIntentData
  if (!paymentIntent.amount || !paymentIntent.payment_method) {
    console.log('Fetching full PaymentIntent details from Stripe...')
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentData.id, {
        expand: ['payment_method']
      })
      console.log('Full PaymentIntent retrieved:', JSON.stringify(paymentIntent, null, 2))
    } catch (error) {
      console.error('Failed to retrieve PaymentIntent:', error)
      return
    }
  }
  
  const applicationId = paymentIntent.metadata?.applicationId || paymentIntent.metadata?.application_id
  console.log('Extracted application ID:', applicationId)
  console.log('All metadata:', JSON.stringify(paymentIntent.metadata, null, 2))
  
  if (!applicationId) {
    console.error('No application ID in payment intent metadata')
    console.error('Available metadata keys:', Object.keys(paymentIntent.metadata || {}))
    return
  }

  console.log('Looking for application with ID:', applicationId)

  // First, let's check if the application exists at all
  console.log('Checking if application exists...')
  const { data: checkData, error: checkError } = await supabase
    .from('applications')
    .select('application_id, payment_status')
    .eq('application_id', applicationId)
    .single()
  
  console.log('Application check result:', { data: checkData, error: checkError })

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
      console.log('Payment method details:', JSON.stringify(paymentMethod, null, 2))
    }
    
    // Check if there's shipping information in the payment intent
    if (paymentIntent.shipping) {
      shippingAddress = paymentIntent.shipping.address
      console.log('Shipping address from PaymentIntent:', shippingAddress)
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

  console.log('Updating application with payment data...')
  console.log('Address data:', JSON.stringify(addressData, null, 2))

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
    .select('application_id, form_data')
    .single()

  console.log('Database update result:', { data, error })

  if (error) {
    console.error('Database update failed:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return
  }

  if (data) {
    console.log('Database updated successfully for application:', data.application_id)
    // Trigger Make.com automation with payment intent and address data
    await triggerMakeAutomation(data.application_id, data.form_data, paymentIntent, addressData)
    
    console.log(`Application ${data.application_id} payment completed successfully via PaymentIntent`)
  } else {
    console.error('No application found for payment intent:', paymentIntent.id)
  }
}

// Handle expired checkout sessions
async function handleCheckoutExpired(session) {
  console.log('Checkout expired:', session.id)
  
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
    console.log(`Checkout session ${session.id} marked as expired`)
  }
}

// Trigger Make.com automation with application data for business workflow
async function triggerMakeAutomation(applicationId, formDataString, paymentIntent, addressData = null) {
  console.log('🚀 TRIGGERING MAKE AUTOMATION - START')
  console.log('Application ID:', applicationId)
  console.log('Payment Intent ID:', paymentIntent?.id)
  
  try {
    // Parse form data
    const formData = typeof formDataString === 'string' 
      ? JSON.parse(formDataString) 
      : formDataString

    // Calculate processing time based on selection
    const getProcessingTime = (option) => {
      switch (option) {
        case 'standard':
          return '3-5 business days'
        case 'express':
          return '2 business days'
        case 'same_day':
          return 'Same/Next business day'
        default:
          return '3-5 business days'
      }
    }

    // Calculate shipping speed requirement for EasyPost (in days)
    const getShippingSpeedDays = (option) => {
      switch (option) {
        case 'standard':
          return 5 // 3-5 days max
        case 'express':
          return 2 // 2 days max
        case 'next_day':
          return 1 // next business day
        default:
          return 5
      }
    }

    // Prepare comprehensive data for Make.com business workflow
    const automationData = {
      // Application identification
      application_id: applicationId,
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      amount_total: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      
      // Customer personal information (for work order)
      customer: {
        first_name: formData.firstName,
        middle_name: formData.middleName || '',
        last_name: formData.lastName,
        full_name: `${formData.firstName} ${formData.middleName || ''} ${formData.lastName}`.trim(),
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth
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
        processing_option: formData.processingOption,
        processing_time_estimate: getProcessingTime(formData.processingOption),
        shipping_option: formData.shippingOption
      },
      
      // Customer uploaded files (base64 in Supabase)
      customer_files: {
        id_document: formData.idDocument || null,
        passport_photo: formData.passportPhoto || null,
        // File naming convention for Make.com to use
        id_document_filename: `${formData.firstName}${formData.lastName}_ID_Document.jpg`,
        passport_photo_filename: `${formData.firstName}${formData.lastName}_Passport_Photo.jpg`
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
          length: 9,    // Standard envelope size
          width: 6,
          height: 0.5,
          weight: 2     // 2 oz for IDP document
        },
        // Speed requirement for EasyPost to filter rates
        max_delivery_days: getShippingSpeedDays(formData.shippingOption),
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

    // Send to Make.com webhook
    const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL || 'https://hook.us2.make.com/ycaa7o76udppdd7m4hn22xe1toj623ts'
    const makeApiKey = process.env.MAKE_API_KEY || 'FIDP_webhook_key_2025_secure123'
    
    if (makeWebhookUrl) {
      console.log('Triggering Make.com business workflow automation...')
      console.log('Sending to:', makeWebhookUrl)
      console.log('API Key:', makeApiKey ? 'SET' : 'NOT SET')
      console.log('Payload:', JSON.stringify(automationData, null, 2))
      
      const response = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-make-apikey': makeApiKey
        },
        body: JSON.stringify(automationData)
      })
      
      console.log('Make.com response status:', response.status)
      console.log('Make.com response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Make.com webhook failed:', response.status, errorText)
        throw new Error(`Make.com webhook failed: ${response.status} ${errorText}`)
      }
      
      const responseText = await response.text()
      console.log('Make.com response body:', responseText)
      
      console.log('✅ Make.com business workflow triggered successfully for application:', applicationId)
      
      // Update database to track automation trigger
      await supabase
        .from('applications')
        .update({
          make_automation_triggered_at: new Date().toISOString(),
          make_automation_status: 'processing'
        })
        .eq('application_id', applicationId)
        
    } else {
      console.log('MAKE_WEBHOOK_URL not configured. Business workflow data prepared:', JSON.stringify(automationData, null, 2))
    }

  } catch (error) {
    console.error('Failed to trigger Make.com business workflow:', error)
    
    // Update database with error status
    await supabase
      .from('applications')
      .update({
        make_automation_status: 'failed',
        make_automation_error: error.message
      })
      .eq('application_id', applicationId)
      .catch(dbError => console.error('Failed to update automation status:', dbError))
  }
}
