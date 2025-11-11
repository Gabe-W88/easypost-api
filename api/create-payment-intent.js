import Stripe from 'stripe'

// Use environment variable for the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY

const stripe = new Stripe(stripeSecretKey)

// Product mapping
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
              // Fallback to hardcoded price if no prices found
              totalAmount += 2000
              lineItems.push({
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: shortPermitName,
                  },
                  unit_amount: 2000, // $20.00
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
    
    // Add combined processing & shipping fee
    if (formData.processingOption && formData.shippingCategory) {
      const speed = formData.processingOption
      const category = formData.shippingCategory
      let amount = 0
      let displayName = ''
      let backendNote = ''
      
      // Calculate combined pricing based on category and speed
      if (category === 'domestic') {
        if (speed === 'standard') {
          amount = 5800 // $58.00
          displayName = 'Standard Processing & Shipping'
          backendNote = '3-5 business days processing & standard shipping'
        } else if (speed === 'fast') {
          amount = 10800 // $108.00
          displayName = 'Fast Processing & Shipping'
          backendNote = '1-2 business days processing & expedited shipping'
        } else if (speed === 'fastest') {
          amount = 16800 // $168.00
          displayName = 'Fastest Processing & Shipping'
          backendNote = 'Same-day processing & overnight shipping'
        }
      } else if (category === 'international') {
        if (speed === 'standard') {
          amount = 9800 // $98.00
          displayName = 'Standard Processing & Shipping'
          backendNote = '3-5 business days processing & standard shipping'
        } else if (speed === 'fast') {
          amount = 14800 // $148.00
          displayName = 'Fast Processing & Shipping'
          backendNote = '1-2 business days processing & expedited shipping'
        } else if (speed === 'fastest') {
          amount = 19800 // $198.00
          displayName = 'Fastest Processing & Shipping'
          backendNote = 'Same-day processing & overnight shipping'
        }
      } else if (category === 'military') {
        if (speed === 'standard') {
          amount = 4900 // $49.00
          displayName = 'Standard Processing & Shipping'
          backendNote = '3-5 business days processing & standard shipping'
        } else if (speed === 'fast') {
          amount = 8900 // $89.00
          displayName = 'Fast Processing & Shipping'
          backendNote = '1-2 business days processing & expedited shipping'
        } else if (speed === 'fastest') {
          amount = 11900 // $119.00
          displayName = 'Fastest Processing & Shipping'
          backendNote = 'Same-day processing & overnight shipping'
        }
      }
      
      if (amount > 0) {
        totalAmount += amount
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: displayName,
              description: backendNote
            },
            unit_amount: amount,
          },
          quantity: 1,
        })
      }
    }


    // Add tax (7.75% for Bellefontaine, OH)
    const subtotalAmount = totalAmount
    const taxRate = 0.0775
    const taxAmount = Math.round(subtotalAmount * taxRate)
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
    res.setHeader('Access-Control-Allow-Origin', 'https://ambiguous-methodologies-053772.framer.app')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    
    return res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    })
  }
}
