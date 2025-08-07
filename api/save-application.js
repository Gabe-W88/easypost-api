import { Client } from 'pg'

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
    const { formData } = req.body

    // Validate required form data
    if (!formData) {
      return res.status(400).json({ error: 'Form data is required' })
    }

    // Validate required fields
    const requiredFields = ['email', 'firstName', 'lastName', 'selectedPermits', 'processingOption', 'shippingOption']
    for (const field of requiredFields) {
      if (!formData[field]) {
        return res.status(400).json({ error: `${field} is required` })
      }
    }

    // Generate unique application ID
    const applicationId = `IDP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Connect to database
    const client = new Client({
      connectionString: process.env.POSTGRES_URL,
      ssl: {
        rejectUnauthorized: false
      }
    })

    await client.connect()

    try {
      // Save application to database
      const query = `
        INSERT INTO applications (application_id, form_data, payment_status, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, application_id, created_at
      `
      
      const values = [
        applicationId,
        JSON.stringify(formData),
        'pending'
      ]

      const result = await client.query(query, values)
      const application = result.rows[0]

      // Calculate pricing based on selections
      const pricing = calculatePricing(formData)

      // Return success with application ID and pricing
      res.status(200).json({
        success: true,
        applicationId: application.application_id,
        pricing,
        message: 'Application saved successfully'
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('Save application error:', error)
    res.status(500).json({ 
      error: 'Failed to save application',
      details: error.message
    })
  }
}

// Helper function to calculate pricing based on form selections
function calculatePricing(formData) {
  let total = 0
  const lineItems = []

  // Add permit costs ($20 each)
  if (formData.selectedPermits && formData.selectedPermits.length > 0) {
    formData.selectedPermits.forEach(permit => {
      if (permit === 'International Driving Permit') {
        lineItems.push({
          productId: STRIPE_PRODUCTS.idp_international,
          name: 'International Driving Permit',
          price: 20,
          quantity: 1
        })
        total += 20
      } else if (permit === 'IAPD (Brazil / Uruguay only)') {
        lineItems.push({
          productId: STRIPE_PRODUCTS.idp_brazil_uruguay,
          name: 'IAPD (Brazil / Uruguay only)',
          price: 20,
          quantity: 1
        })
        total += 20
      }
    })
  }

  // Add processing cost
  if (formData.processingOption) {
    const processing = formData.processingOption
    if (processing.includes('Standard')) {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_standard,
        name: 'Standard Processing',
        price: 69,
        quantity: 1
      })
      total += 69
    } else if (processing.includes('Express')) {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_express,
        name: 'Express Processing',
        price: 99,
        quantity: 1
      })
      total += 99
    } else if (processing.includes('Same Day')) {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_same_day,
        name: 'Same Day Processing',
        price: 129,
        quantity: 1
      })
      total += 129
    }
  }

  // Add shipping cost
  if (formData.shippingOption) {
    const shipping = formData.shippingOption
    if (shipping.includes('Standard')) {
      lineItems.push({
        productId: STRIPE_PRODUCTS.shipping_standard,
        name: 'US Standard Shipping',
        price: 9,
        quantity: 1
      })
      total += 9
    } else if (shipping.includes('Express')) {
      lineItems.push({
        productId: STRIPE_PRODUCTS.shipping_express,
        name: 'US Express Shipping',
        price: 19,
        quantity: 1
      })
      total += 19
    } else if (shipping.includes('Next Day')) {
      lineItems.push({
        productId: STRIPE_PRODUCTS.shipping_next_day,
        name: 'US Next Day Shipping',
        price: 49,
        quantity: 1
      })
      total += 49
    }
  }

  return {
    lineItems,
    total,
    subtotal: total,
    currency: 'usd'
  }
}
