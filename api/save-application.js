import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
    const { formData, fileData } = req.body

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

    // Validate file uploads
    if (!fileData || !fileData.driversLicense || !fileData.passportPhoto) {
      return res.status(400).json({ error: 'Both driver\'s license and passport photo uploads are required' })
    }

    if (fileData.driversLicense.length === 0 || fileData.passportPhoto.length === 0) {
      return res.status(400).json({ error: 'At least one file must be uploaded for each document type' })
    }

    // Generate unique application ID
    const applicationId = `IDP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Save application to database using Supabase client
    const { data, error } = await supabase
      .from('applications')
      .insert({
        application_id: applicationId,
        form_data: formData,
        file_data: fileData,  // Store file data as JSON
        payment_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Database error: ${error.message}`)
    }

    // Calculate pricing based on selections
    const pricing = calculatePricing(formData)

    // Return success with application ID and pricing
    res.status(200).json({
      success: true,
      applicationId: applicationId,
      pricing,
      message: 'Application saved successfully'
    })

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
