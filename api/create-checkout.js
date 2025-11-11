import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

// Use the same Stripe key as other files
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY
const stripe = new Stripe(stripeSecretKey)

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Stripe product mapping for form selections
const STRIPE_PRODUCTS = {
  // Permits ($20 each)
  idp_international: 'prod_StLB80b39cwGwe',
  idp_brazil_uruguay: 'prod_StL0mfYEghMQd7',
  
  // Processing Options
  processing_standard: 'prod_StLCI6MmfjwY8u',    // $69
  processing_express: 'prod_StLCgdjyMxHEkX',     // $109
  processing_same_day: 'prod_StLCyJMauosNpo',    // $169
  
  // Shipping Options
  shipping_international_standard: 'prod_StLCXINozg6poK',      // $49
  shipping_international_express: 'prod_StLDaMbeIjAQ5K',       // $79
  shipping_domestic_standard: 'prod_StLD5UEXiEVuKH',           // $9
  shipping_domestic_express: 'prod_StLD5UEXiEVuKI',            // $19
  shipping_domestic_overnight: 'prod_StLD5UEXiEVuKJ',          // $49
  shipping_military_free: 'prod_StLD5UEXiEVuKK',              // $0
}

export default async function handler(req, res) {
  // Enable CORS for Framer and main domain
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

  try {
    const { applicationId, formData } = req.body

    // Validate required data
    if (!applicationId || !formData) {
      return res.status(400).json({ error: 'Application ID and form data are required' })
    }

    // Build line items for Stripe based on form selections
    const lineItems = buildStripeLineItems(formData)
    
    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'No valid items selected for checkout' })
    }

    // Create Stripe checkout session
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `https://www.fastidp.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://www.fastidp.com/apply?step=3`,
      metadata: {
        application_id: applicationId,
        customer_email: formData.email || '',
        customer_name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
      },
      customer_email: formData.email,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US']
      }
    }

    // Add promo code support if provided
    if (formData.promoCode && formData.promoCode.trim()) {
      sessionConfig.allow_promotion_codes = true
      // Note: Stripe will validate the promo code automatically during checkout
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Update database with Stripe session ID using Supabase
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        stripe_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)

    if (updateError) {
      console.error('Failed to update application with session ID:', updateError)
      // Don't fail the checkout, just log the error
    }

    // Return checkout URL
    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Create checkout error:', error)
    
    // Ensure CORS headers are set even in error responses
    res.setHeader('Access-Control-Allow-Origin', 'https://ambiguous-methodologies-053772.framer.app')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message
    })
  }
}

// Helper function to build Stripe line items from form data
function buildStripeLineItems(formData) {
  const lineItems = []

  // Add permits ($20 each)
  if (formData.selectedPermits && formData.selectedPermits.length > 0) {
    formData.selectedPermits.forEach(permit => {
      if (permit === 'International Driving Permit') {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product: STRIPE_PRODUCTS.idp_international,
            unit_amount: 2000 // $20.00 in cents
          },
          quantity: 1
        })
      } else if (permit === 'IAPD (Brazil / Uruguay only)') {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product: STRIPE_PRODUCTS.idp_brazil_uruguay,
            unit_amount: 2000 // $20.00 in cents
          },
          quantity: 1
        })
      }
    })
  }

  // Add combined processing & shipping option
  if (formData.processingOption && formData.shippingCategory) {
    const speed = formData.processingOption
    const category = formData.shippingCategory
    let amount = 0
    
    // Calculate combined pricing based on category and speed
    if (category === 'domestic') {
      if (speed === 'standard') {
        amount = 5800 // $58.00 in cents
      } else if (speed === 'fast') {
        amount = 10800 // $108.00 in cents
      } else if (speed === 'fastest') {
        amount = 16800 // $168.00 in cents
      }
    } else if (category === 'international') {
      if (speed === 'standard') {
        amount = 9800 // $98.00 in cents
      } else if (speed === 'fast') {
        amount = 14800 // $148.00 in cents
      } else if (speed === 'fastest') {
        amount = 19800 // $198.00 in cents
      }
    } else if (category === 'military') {
      if (speed === 'standard') {
        amount = 4900 // $49.00 in cents
      } else if (speed === 'fast') {
        amount = 8900 // $89.00 in cents
      } else if (speed === 'fastest') {
        amount = 11900 // $119.00 in cents
      }
    }
    
    if (amount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${speed.charAt(0).toUpperCase() + speed.slice(1)} Processing & Shipping`
          },
          unit_amount: amount
        },
        quantity: 1
      })
    }
  }

  return lineItems
}
