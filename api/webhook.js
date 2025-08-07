import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
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
    // Trigger Make.com automation
    await triggerMakeAutomation(data.application_id, data.form_data, session)
    
    console.log(`Application ${data.application_id} payment completed successfully`)
  } else {
    console.error('No application found for session:', session.id)
  }
}

// Handle payment intent success (additional confirmation)
async function handlePaymentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id)
  
  // Additional logic if needed - payment is already handled in checkout.session.completed
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

// Trigger Make.com automation with application data
async function triggerMakeAutomation(applicationId, formDataString, session) {
  try {
    // Parse form data
    const formData = typeof formDataString === 'string' 
      ? JSON.parse(formDataString) 
      : formDataString

    // Prepare data for Make.com
    const automationData = {
      application_id: applicationId,
      payment_status: 'completed',
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent,
      customer_email: session.customer_email || formData.email,
      amount_total: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      
      // Application details
      personal_info: {
        first_name: formData.firstName,
        middle_name: formData.middleName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth
      },
      
      license_info: {
        license_number: formData.licenseNumber,
        license_state: formData.licenseState,
        license_expiration: formData.licenseExpiration
      },
      
      address_info: {
        street_address: formData.streetAddress,
        street_address_2: formData.streetAddress2,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zipCode
      },
      
      selections: {
        license_types: formData.licenseTypes,
        selected_permits: formData.selectedPermits,
        processing_option: formData.processingOption,
        shipping_option: formData.shippingOption
      },
      
      additional_info: {
        birthplace_city: formData.birthplaceCity,
        birthplace_state: formData.birthplaceState,
        drive_abroad: formData.driveAbroad,
        departure_date: formData.departureDate,
        permit_effective_date: formData.permitEffectiveDate
      },
      
      timestamps: {
        created_at: new Date().toISOString(),
        payment_completed_at: new Date().toISOString()
      }
    }

    // TODO: Replace with your actual Make.com webhook URL
    // const makeWebhookUrl = 'https://hook.make.com/your-webhook-url-here'
    
    // For now, just log the data that would be sent
    console.log('Would trigger Make.com automation with data:', JSON.stringify(automationData, null, 2))
    
    // Uncomment when you have your Make.com webhook URL:
    /*
    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(automationData)
    })
    
    if (!response.ok) {
      throw new Error(`Make.com webhook failed: ${response.status}`)
    }
    
    console.log('Make.com automation triggered successfully for application:', applicationId)
    */

  } catch (error) {
    console.error('Failed to trigger Make.com automation:', error)
    // Don't throw - we don't want to fail the webhook if automation fails
  }
}
