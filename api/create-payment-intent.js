import Stripe from 'stripe'
import { PERMIT_PRICES, getCombinedPriceCents, getSpeedDisplayName, TAX } from '../config/pricing.js'

// Use environment variable for the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY

const stripe = new Stripe(stripeSecretKey)

export default async function handler(req, res) {
  // Enable CORS for Framer and main domain
  // Previous URL (rollback): 'https://ambiguous-methodologies-053772.framer.app'
  res.setHeader('Access-Control-Allow-Origin', 'https://serious-flows-972417.framer.app')
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
      return res.status(400).json({ error: 'Application ID and form data required' })
    }
    
    // Calculate total amount based on selections
    let totalAmount = 0
    const lineItems = []
    
    // Add permit fees ($20 each)
    if (formData.selectedPermits && formData.selectedPermits.length > 0) {
      for (const permit of formData.selectedPermits) {
        
        // Map human-readable names to product IDs (same as create-checkout.js)
        let productId = null
        let shortPermitName = ''
        if (permit === 'International Driving Permit') {
          productId = STRIPE_PRODUCTS.idp_international
          shortPermitName = 'IDP'
        } else if (permit === 'IAPD (Brazil / Uruguay only)') {
          productId = STRIPE_PRODUCTS.idp_brazil_uruguay
          shortPermitName = 'IAPD'
        }
        
        if (productId) {
          try {
            const product = await stripe.products.retrieve(productId)
            const prices = await stripe.prices.list({
              product: productId,
              active: true,
              limit: 1
            })
            
            if (prices.data.length > 0) {
              const price = prices.data[0]
              totalAmount += price.unit_amount
              lineItems.push({
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: shortPermitName,
                  },
                  unit_amount: price.unit_amount,
                },
                quantity: 1,
              })
            } else {
              // Fallback to pricing config if no Stripe prices found
              const permitPrice = PERMIT_PRICES.idp * 100 // Convert to cents
              totalAmount += permitPrice
              lineItems.push({
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: shortPermitName,
                  },
                  unit_amount: permitPrice,
                },
                quantity: 1,
              })
            }
          } catch (error) {
            console.warn(`Product not found for permit: ${permit}`, error)
          }
        }
      }
    }
    
    // Add combined processing & shipping fee (from centralized pricing config)
    if (formData.processingOption && formData.shippingCategory) {
      const speed = formData.processingOption
      const category = formData.shippingCategory
      const amount = getCombinedPriceCents(category, speed)
      const displayName = getSpeedDisplayName(speed)
      
      if (amount > 0) {
        totalAmount += amount
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: displayName,
            },
            unit_amount: amount,
          },
          quantity: 1,
        })
      }
    }


    // Add tax from centralized config
    const subtotalAmount = totalAmount
    const taxAmount = Math.round(subtotalAmount * TAX.rate)
    totalAmount += taxAmount

    // Add tax as separate line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Tax',
        },
        unit_amount: taxAmount,
      },
      quantity: 1,
    })


    // Minimum amount check
    if (totalAmount < 50) { // $0.50 minimum for Stripe
      return res.status(400).json({ error: 'Order total too low' })
    }


    // Build product summary for metadata
    const productSummary = []
    const productDetails = {}

    // Add permits to summary
    if (formData.selectedPermits && formData.selectedPermits.length > 0) {
      formData.selectedPermits.forEach((permit, index) => {
        // Shorten permit names for metadata
        const shortName = permit.includes('Brazil') ? 'IAPD ($20)' : 'IDP ($20)'
        productSummary.push(shortName)
        productDetails[`permit_${index + 1}`] = permit
        productDetails[`permit_${index + 1}_price`] = '$20.00'
      })
    }

    // Add processing option
    if (formData.processingOption) {
      const processingLabels = {
        standard: 'Standard ($69)',
        express: 'Express ($109)', 
        same_day: 'Same Day ($169)'
      }
      const label = processingLabels[formData.processingOption] || formData.processingOption
      productSummary.push(label)
      productDetails.processing_option = label
    }

    // Create PaymentIntent with detailed metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        applicationId: applicationId,
        customer_email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        total_amount: `$${(totalAmount / 100).toFixed(2)}`,
        product_summary: productSummary.join(', '),
        permit_count: formData.selectedPermits?.length || 0,
        processing_type: formData.processingOption || 'not_selected',
        shipping_category: formData.shippingCategory || 'not_selected',
        ...productDetails
      },
      receipt_email: formData.email,
      description: `IDP Application: ${productSummary.join(', ')} - ${formData.firstName} ${formData.lastName}`,
    })


    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    
    // Ensure CORS headers are set even in error responses
    // Previous URL (rollback): 'https://ambiguous-methodologies-053772.framer.app'
    res.setHeader('Access-Control-Allow-Origin', 'https://serious-flows-972417.framer.app')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    
    return res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    })
  }
}
