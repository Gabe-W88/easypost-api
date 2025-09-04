import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Stripe product mapping for form selections (updated with test product IDs)
const STRIPE_PRODUCTS = {
  // Permits ($20 each)
  idp_international: 'prod_StLB80b39cwGwe',
  idp_brazil_uruguay: 'prod_StL0mfYEghMQd7',
  
  // Processing Options
  processing_standard: 'prod_StLCI6MmfjwY8u',    // $69
  processing_express: 'prod_StLCgdjyMxHEkX',     // $99
  processing_same_day: 'prod_StLCyJMauosNpo',    // $129
  
  // Shipping Options
  shipping_standard: 'prod_StLCXINozg6poK',      // $9
  shipping_express: 'prod_StLDaMbeIjAQ5K',       // $19
  shipping_next_day: 'prod_StLD5UEXiEVuKH',      // $49
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

    // Debug: Check what we're receiving
    console.log('=== FORM VALIDATION DEBUG ===')
    console.log('Full formData:', JSON.stringify(formData, null, 2))
    console.log('shippingOption:', formData.shippingOption, 'type:', typeof formData.shippingOption)
    console.log('processingOption:', formData.processingOption, 'type:', typeof formData.processingOption)

    // Validate required fields (temporarily skip shipping for debugging)
    const requiredFields = ['email', 'firstName', 'lastName', 'selectedPermits', 'processingOption']
    for (const field of requiredFields) {
      const value = formData[field]
      
      if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
        console.log(`Field validation failed: ${field}`, value)
        return res.status(400).json({ 
          error: `${field} is required`,
          received: value,
          type: typeof value
        })
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

    // Save application to database
    const { data, error } = await supabase
      .from('applications')
      .insert({
        application_id: applicationId,
        form_data: formData,
        file_data: fileData,
        payment_status: 'pending'
      })
      .select()

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ 
        error: 'Failed to save to database',
        details: error.message
      })
    }

    // Calculate pricing
    const pricing = calculatePricing(formData)

    res.status(200).json({
      success: true,
      applicationId: applicationId,
      data: data[0],
      pricing: pricing
    })

  } catch (error) {
    console.error('Save application error:', error)
    res.status(500).json({ 
      error: 'Failed to save application',
      details: error.message
    })
  }
}

// Helper function to calculate pricing
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
    if (processing === 'standard') {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_standard,
        name: 'Standard Processing',
        price: 69,
        quantity: 1
      })
      total += 69
    } else if (processing === 'express') {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_express,
        name: 'Express Processing',
        price: 99,
        quantity: 1
      })
      total += 99
    } else if (processing === 'same_day') {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_same_day,
        name: 'Same Day Processing',
        price: 129,
        quantity: 1
      })
      total += 129
    }
  }

  // Add shipping cost based on category and speed
  if (formData.shippingCategory && formData.shippingOption) {
    const category = formData.shippingCategory
    const speed = formData.shippingOption
    let shippingPrice = 0
    let shippingName = ''

    // Calculate price based on category and speed
    if (category === 'international') {
      switch (speed) {
        case 'standard':
          shippingPrice = 181.02
          shippingName = 'International Standard Shipping'
          break
        case 'express':
          shippingPrice = 213.35
          shippingName = 'International Express Shipping'
          break
        case 'next_day':
          shippingPrice = 245.67
          shippingName = 'International Next Day Shipping'
          break
        default:
          shippingPrice = 181.02
          shippingName = 'International Standard Shipping'
      }
    } else if (category === 'domestic') {
      switch (speed) {
        case 'standard':
          shippingPrice = 105.60
          shippingName = 'Domestic Standard Shipping'
          break
        case 'express':
          shippingPrice = 148.35
          shippingName = 'Domestic Express Shipping'
          break
        case 'next_day':
          shippingPrice = 213.35
          shippingName = 'Domestic Next Day Shipping'
          break
        default:
          shippingPrice = 105.60
          shippingName = 'Domestic Standard Shipping'
      }
    } else if (category === 'military') {
      switch (speed) {
        case 'standard':
          shippingPrice = 95.90
          shippingName = 'Military Standard Shipping'
          break
        case 'express':
          shippingPrice = 128.22
          shippingName = 'Military Express Shipping'
          break
        case 'next_day':
          shippingPrice = 160.55
          shippingName = 'Military Next Day Shipping'
          break
        default:
          shippingPrice = 95.90
          shippingName = 'Military Standard Shipping'
      }
    }

    if (shippingPrice > 0) {
      lineItems.push({
        productId: `shipping_${category}_${speed}`,
        name: shippingName,
        price: shippingPrice,
        quantity: 1
      })
      total += shippingPrice
    }
  }

  return {
    lineItems,
    total,
    subtotal: total,
    currency: 'usd'
  }
}
