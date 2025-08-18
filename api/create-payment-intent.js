import Stripe from 'stripe'

// Use environment variable for the secret key with debugging
const stripeSecretKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY
console.log('Using Stripe key ending with:', stripeSecretKey ? stripeSecretKey.slice(-6) : 'MISSING')

const stripe = new Stripe(stripeSecretKey)

// Product mapping (updated with test product IDs)
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
    const { applicationId, formData } = req.body

    // Validate required data
    if (!applicationId || !formData) {
      return res.status(400).json({ error: 'Application ID and form data required' })
    }

    console.log('Creating payment intent for application:', applicationId)
    console.log('Form data received:', JSON.stringify(formData, null, 2))
    
    // Calculate total amount based on selections
    let totalAmount = 0
    const lineItems = []
    
    // Add permit fees ($20 each)
    console.log('Processing permits:', formData.selectedPermits)
    if (formData.selectedPermits && formData.selectedPermits.length > 0) {
      for (const permit of formData.selectedPermits) {
        console.log('Looking up permit:', permit)
        
        // Map human-readable names to product IDs (same as create-checkout.js)
        let productId = null
        if (permit === 'International Driving Permit') {
          productId = STRIPE_PRODUCTS.idp_international
        } else if (permit === 'IAPD (Brazil / Uruguay only)') {
          productId = STRIPE_PRODUCTS.idp_brazil_uruguay
        }
        
        console.log('Product ID for permit:', productId)
        if (productId) {
          try {
            const product = await stripe.products.retrieve(productId)
            const prices = await stripe.prices.list({
              product: productId,
              active: true,
              limit: 1
            })
            
            console.log('Found prices for permit:', prices.data.length)
            if (prices.data.length > 0) {
              const price = prices.data[0]
              console.log('Adding permit price:', price.unit_amount, 'cents')
              totalAmount += price.unit_amount
              lineItems.push({
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: product.name,
                  },
                  unit_amount: price.unit_amount,
                },
                quantity: 1,
              })
            } else {
              // Fallback to hardcoded price if no prices found
              console.log('No prices found, using fallback price: 2000 cents')
              totalAmount += 2000
              lineItems.push({
                price_data: {
                  currency: 'usd',
                  product_data: {
                    name: permit,
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
    
    // Add processing fee
    console.log('Processing option:', formData.processingOption)
    if (formData.processingOption) {
      const processing = formData.processingOption
      let productId = null
      let fallbackAmount = 0
      
      // Map processing options to new simplified values
      if (processing === 'standard') {
        productId = STRIPE_PRODUCTS.processing_standard
        fallbackAmount = 6900 // $69.00
      } else if (processing === 'express') {
        productId = STRIPE_PRODUCTS.processing_express
        fallbackAmount = 9900 // $99.00
      } else if (processing === 'same_day') {
        productId = STRIPE_PRODUCTS.processing_same_day
        fallbackAmount = 12900 // $129.00
      }
      
      console.log('Product ID for processing:', productId)
      if (productId) {
        try {
          const product = await stripe.products.retrieve(productId)
          const prices = await stripe.prices.list({
            product: productId,
            active: true,
            limit: 1
          })
          
          console.log('Found prices for processing:', prices.data.length)
          if (prices.data.length > 0) {
            const price = prices.data[0]
            console.log('Adding processing price:', price.unit_amount, 'cents')
            totalAmount += price.unit_amount
            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: product.name,
                },
                unit_amount: price.unit_amount,
              },
              quantity: 1,
            })
          } else {
            // Fallback to hardcoded price
            console.log('No prices found, using fallback price:', fallbackAmount, 'cents')
            totalAmount += fallbackAmount
            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: processing,
                },
                unit_amount: fallbackAmount,
              },
              quantity: 1,
            })
          }
        } catch (error) {
          console.warn(`Product not found for processing: ${formData.processingOption}`, error)
          // Use fallback pricing
          console.log('Using fallback price:', fallbackAmount, 'cents')
          totalAmount += fallbackAmount
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: processing,
              },
              unit_amount: fallbackAmount,
            },
            quantity: 1,
          })
        }
      }
    }
    
    // Add shipping fee
    console.log('Shipping option:', formData.shippingOption)
    if (formData.shippingOption) {
      const shipping = formData.shippingOption
      let productId = null
      let fallbackAmount = 0
      
      // Map shipping options to new simplified values
      if (shipping === 'standard') {
        productId = STRIPE_PRODUCTS.shipping_standard
        fallbackAmount = 900 // $9.00
      } else if (shipping === 'express') {
        productId = STRIPE_PRODUCTS.shipping_express
        fallbackAmount = 1900 // $19.00
      } else if (shipping === 'next_day') {
        productId = STRIPE_PRODUCTS.shipping_next_day
        fallbackAmount = 4900 // $49.00
      }
      
      console.log('Product ID for shipping:', productId)
      if (productId) {
        try {
          const product = await stripe.products.retrieve(productId)
          const prices = await stripe.prices.list({
            product: productId,
            active: true,
            limit: 1
          })
          
          console.log('Found prices for shipping:', prices.data.length)
          if (prices.data.length > 0) {
            const price = prices.data[0]
            console.log('Adding shipping price:', price.unit_amount, 'cents')
            totalAmount += price.unit_amount
            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: product.name,
                },
                unit_amount: price.unit_amount,
              },
              quantity: 1,
            })
          } else {
            // Fallback to hardcoded price
            console.log('No prices found, using fallback price:', fallbackAmount, 'cents')
            totalAmount += fallbackAmount
            lineItems.push({
              price_data: {
                currency: 'usd',
                product_data: {
                  name: shipping,
                },
                unit_amount: fallbackAmount,
              },
              quantity: 1,
            })
          }
        } catch (error) {
          console.warn(`Product not found for shipping: ${formData.shippingOption}`, error)
          // Use fallback pricing
          console.log('Using fallback price:', fallbackAmount, 'cents')
          totalAmount += fallbackAmount
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: shipping,
              },
              unit_amount: fallbackAmount,
            },
            quantity: 1,
          })
        }
      }
    }

    console.log('Final total amount:', totalAmount, 'cents')

    // Minimum amount check
    if (totalAmount < 50) { // $0.50 minimum for Stripe
      return res.status(400).json({ error: 'Order total too low' })
    }

    console.log('Total amount calculated:', totalAmount, 'cents')

    // Build product summary for metadata
    const productSummary = []
    const productDetails = {}

    // Add permits to summary
    if (formData.selectedPermits && formData.selectedPermits.length > 0) {
      formData.selectedPermits.forEach((permit, index) => {
        productSummary.push(`${permit} ($20)`)
        productDetails[`permit_${index + 1}`] = permit
        productDetails[`permit_${index + 1}_price`] = '$20.00'
      })
    }

    // Add processing option
    if (formData.processingOption) {
      const processingLabels = {
        standard: 'Standard Processing ($69)',
        express: 'Express Processing ($99)', 
        same_day: 'Same Day Processing ($129)'
      }
      const label = processingLabels[formData.processingOption] || formData.processingOption
      productSummary.push(label)
      productDetails.processing_option = label
    }

    // Add shipping option
    if (formData.shippingOption) {
      const shippingLabels = {
        standard: 'US Standard Shipping ($9)',
        express: 'US Express Shipping ($19)',
        next_day: 'US Next Day Shipping ($49)'
      }
      const label = shippingLabels[formData.shippingOption] || formData.shippingOption
      productSummary.push(label)
      productDetails.shipping_option = label
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
        shipping_type: formData.shippingOption || 'not_selected',
        line_items: JSON.stringify(lineItems),
        ...productDetails
      },
      receipt_email: formData.email,
      description: `IDP Application: ${productSummary.join(', ')} - ${formData.firstName} ${formData.lastName}`,
    })

    console.log('PaymentIntent created:', paymentIntent.id)

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    return res.status(500).json({ 
      error: 'Failed to create payment intent',
      details: error.message 
    })
  }
}
