import Stripe from 'stripe'
import { Client } from 'pg'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Stripe product mapping for form selections
const STRIPE_PRODUCTS = {
  // Permits ($20 each)
  idp_international: 'prod_RNgiYrwBJb5dbE',
  idp_brazil_uruguay: 'prod_SMY4pMBqlgyuuA',
  
  // Processing Options
  processing_standard: 'prod_SIYd11YsNI0rdq',    // $69
  processing_express: 'prod_SozBmuiOv9jgfX',     // $99
  processing_same_day: 'prod_SozE7GytJcYcZi',    // $129
  
  // Shipping Options
  shipping_standard: 'prod_SozG66tNrCWnKF',      // $9
  shipping_express: 'prod_SozGhf2ITA2sZK',       // $19
  shipping_next_day: 'prod_SozHGobwdxOfYw'       // $49
}

export default async function handler(req, res) {
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
    const session = await stripe.checkout.sessions.create({
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
    })

    // Update database with Stripe session ID
    const client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })

    await client.connect()

    try {
      const query = `
        UPDATE applications 
        SET stripe_session_id = $1, updated_at = NOW()
        WHERE application_id = $2
      `
      await client.query(query, [session.id, applicationId])

    } finally {
      await client.end()
    }

    // Return checkout URL
    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    })

  } catch (error) {
    console.error('Create checkout error:', error)
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

  // Add processing option
  if (formData.processingOption) {
    const processing = formData.processingOption
    if (processing.includes('Standard')) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product: STRIPE_PRODUCTS.processing_standard,
          unit_amount: 6900 // $69.00 in cents
        },
        quantity: 1
      })
    } else if (processing.includes('Express')) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product: STRIPE_PRODUCTS.processing_express,
          unit_amount: 9900 // $99.00 in cents
        },
        quantity: 1
      })
    } else if (processing.includes('Same Day')) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product: STRIPE_PRODUCTS.processing_same_day,
          unit_amount: 12900 // $129.00 in cents
        },
        quantity: 1
      })
    }
  }

  // Add shipping option
  if (formData.shippingOption) {
    const shipping = formData.shippingOption
    if (shipping.includes('Standard')) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product: STRIPE_PRODUCTS.shipping_standard,
          unit_amount: 900 // $9.00 in cents
        },
        quantity: 1
      })
    } else if (shipping.includes('Express')) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product: STRIPE_PRODUCTS.shipping_express,
          unit_amount: 1900 // $19.00 in cents
        },
        quantity: 1
      })
    } else if (shipping.includes('Next Day')) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product: STRIPE_PRODUCTS.shipping_next_day,
          unit_amount: 4900 // $49.00 in cents
        },
        quantity: 1
      })
    }
  }

  return lineItems
}
