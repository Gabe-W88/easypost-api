import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

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

  const sig = req.headers['stripe-signature']
  let event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET
    )
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
        console.log(`Unhandled event type: ${event.type}`)
    }

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    res.status(500).json({ error: 'Webhook handler failed' })
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
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)
  
  const applicationId = paymentIntent.metadata?.applicationId
  
  if (!applicationId) {
    console.error('No application ID in payment intent metadata')
    return
  }

  // Get the payment method to extract address details
  let paymentMethod = null
  let shippingAddress = null
  
  try {
    if (paymentIntent.payment_method) {
      paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
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

  const { data, error } = await supabase
    .from('applications')
    .update({
      payment_status: 'completed',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_payment_method_id: paymentIntent.payment_method,
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

  if (error) {
    console.error('Database update failed:', error)
    return
  }

  if (data) {
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
    const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL
    
    if (makeWebhookUrl) {
      console.log('Triggering Make.com business workflow automation...')
      
      const response = await fetch(makeWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(automationData)
      })
      
      if (!response.ok) {
        throw new Error(`Make.com webhook failed: ${response.status} ${await response.text()}`)
      }
      
      console.log('Make.com business workflow triggered successfully for application:', applicationId)
      
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
