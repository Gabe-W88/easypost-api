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

    console.log('Creating payment intent for application:', applicationId)
    console.log('Form data received:', JSON.stringify(formData, null, 2))
    console.log('Shipping category received:', formData.shippingCategory)
    console.log('Shipping option received:', formData.shippingOption)
    
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
        let shortPermitName = ''
        if (permit === 'International Driving Permit') {
          productId = STRIPE_PRODUCTS.idp_international
          shortPermitName = 'IDP'
        } else if (permit === 'IAPD (Brazil / Uruguay only)') {
          productId = STRIPE_PRODUCTS.idp_brazil_uruguay
          shortPermitName = 'IAPD'
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
                    name: shortPermitName,
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
    
    // Add processing fee
    console.log('Processing option:', formData.processingOption)
    if (formData.processingOption) {
      const processing = formData.processingOption
      let productId = null
      let fallbackAmount = 0
      let shortName = ''
      
      // Map processing options to new simplified values
      if (processing === 'standard') {
        productId = STRIPE_PRODUCTS.processing_standard
        fallbackAmount = 6900 // $69.00
        shortName = 'Standard'
      } else if (processing === 'express') {
        productId = STRIPE_PRODUCTS.processing_express
        fallbackAmount = 10900 // $109.00
        shortName = 'Express'
      } else if (processing === 'same_day') {
        productId = STRIPE_PRODUCTS.processing_same_day
        fallbackAmount = 16900 // $169.00
        shortName = 'Same Day'
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
                  name: shortName,
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
                  name: shortName,
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
    
    // Add shipping fee based on category and speed
    console.log('Shipping category:', formData.shippingCategory, 'speed:', formData.shippingOption)
    if (formData.shippingCategory && formData.shippingOption) {
      const category = formData.shippingCategory
      const speed = formData.shippingOption
      let shippingAmount = 0
      let shippingName = ''
      
      // Calculate shipping cost based on category and speed
      if (category === 'international') {
        switch (speed) {
          case 'standard':
            shippingAmount = 4900 // $49.00
            shippingName = 'Intl Standard'
            break
          case 'express':
            shippingAmount = 7900 // $79.00
            shippingName = 'Intl Express'
            break
          default:
            shippingAmount = 4900
            shippingName = 'Intl Standard'
        }
      } else if (category === 'domestic') {
        switch (speed) {
          case 'standard':
            shippingAmount = 900 // $9.00
            shippingName = 'Domestic Standard'
            break
          case 'express':
            shippingAmount = 1900 // $19.00
            shippingName = 'Domestic Express'
            break
          case 'overnight':
            shippingAmount = 4900 // $49.00
            shippingName = 'Domestic Overnight'
            break
          default:
            shippingAmount = 900
            shippingName = 'Domestic Standard'
        }
      } else if (category === 'military') {
        // Military shipping is always free
        shippingAmount = 0 // $0.00
        shippingName = 'Military Free'
      }
      
      if (shippingAmount > 0) {
        console.log('Adding shipping:', shippingName, shippingAmount, 'cents')
        totalAmount += shippingAmount
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: {
              name: shippingName,
            },
            unit_amount: shippingAmount,
          },
          quantity: 1,
        })
      }
    }

    console.log('Final total amount (before tax):', totalAmount, 'cents')

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

    console.log('Tax amount:', taxAmount, 'cents')
    console.log('Final total amount (with tax):', totalAmount, 'cents')

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

    // Add shipping option
    console.log('=== SHIPPING DEBUG ===')
    console.log('formData.shippingOption:', formData.shippingOption)
    console.log('formData.shippingCategory:', formData.shippingCategory)
    console.log('Both present?', !!(formData.shippingOption && formData.shippingCategory))
    
    if (formData.shippingOption && formData.shippingCategory) {
      const category = formData.shippingCategory
      const speed = formData.shippingOption
      let shippingLabel = ''
      
      console.log('Building shipping label for category:', category, 'speed:', speed)
      
            // Build shipping label based on category and speed with actual prices
      if (category === 'international') {
        switch (speed) {
          case 'standard':
            shippingLabel = 'Intl Standard ($181.02)'
            break
          case 'express':
            shippingLabel = 'Intl Express ($213.35)'
            break
          case 'next_day':
            shippingLabel = 'Intl Next Day ($245.67)'
            break
          default:
            shippingLabel = 'Intl Standard ($181.02)'
        }
      } else if (category === 'domestic') {
        switch (speed) {
          case 'standard':
            shippingLabel = 'Domestic Standard ($8.05)'
            break
          case 'express':
            shippingLabel = 'Domestic Express ($14.83)'
            break
          case 'overnight':
            shippingLabel = 'Domestic Overnight ($21.33)'
            break
          default:
            shippingLabel = 'Domestic Standard ($8.05)'
        }
      } else if (category === 'military') {
        switch (speed) {
          case 'free':
            shippingLabel = 'Military Free ($0.00)'
            break
          default:
            shippingLabel = 'Military Free ($0.00)'
        }
      } else {
        console.log('Unknown shipping category, using fallback')
        shippingLabel = `${category} ${speed} Shipping`
      }
      
      console.log('Final shipping label:', shippingLabel)
      productSummary.push(shippingLabel)
      productDetails.shipping_option = shippingLabel
    } else if (formData.shippingOption) {
      // Try to infer the category from the amount charged or make a smarter fallback
      console.log('=== ATTEMPTING SMART FALLBACK ===')
      
      // Look at the line items to see what shipping amount was charged
      const shippingLineItem = lineItems.find(item => 
        item.price_data && item.price_data.product_data && 
        item.price_data.product_data.name && 
        item.price_data.product_data.name.toLowerCase().includes('shipping')
      )
      
      if (shippingLineItem) {
        const shippingAmount = shippingLineItem.price_data.unit_amount
        const speed = formData.shippingOption
        let shippingLabel = ''
        
        console.log('Found shipping line item with amount:', shippingAmount)
        
        // Infer category from amount
        if (speed === 'next_day') {
          if (shippingAmount === 24567) {
            shippingLabel = 'Intl Next Day ($245.67)'
          } else if (shippingAmount === 21335) {
            shippingLabel = 'Dom Next Day ($213.35)'
          } else if (shippingAmount === 16055) {
            shippingLabel = 'Mil Next Day ($160.55)'
          } else {
            shippingLabel = `Next Day ($${(shippingAmount / 100).toFixed(2)})`
          }
        } else if (speed === 'express') {
          if (shippingAmount === 21335) {
            shippingLabel = 'Intl Express ($213.35)'
          } else if (shippingAmount === 14835) {
            shippingLabel = 'Dom Express ($148.35)'
          } else if (shippingAmount === 12822) {
            shippingLabel = 'Mil Express ($128.22)'
          } else {
            shippingLabel = `Express ($${(shippingAmount / 100).toFixed(2)})`
          }
        } else { // standard
          if (shippingAmount === 18102) {
            shippingLabel = 'Intl Standard ($181.02)'
          } else if (shippingAmount === 10560) {
            shippingLabel = 'Dom Standard ($105.60)'
          } else if (shippingAmount === 9590) {
            shippingLabel = 'Mil Standard ($95.90)'
          } else {
            shippingLabel = `Standard ($${(shippingAmount / 100).toFixed(2)})`
          }
        }
        
        console.log('Inferred shipping label:', shippingLabel)
        productSummary.push(shippingLabel)
        productDetails.shipping_option = shippingLabel
      } else {
        // Ultimate fallback to old system
        console.log('Using old fallback shipping logic')
        const shippingLabels = {
          standard: 'US Standard ($9)',
          express: 'US Express ($19)',
          next_day: 'US Next Day ($49)'
        }
        const label = shippingLabels[formData.shippingOption] || formData.shippingOption
        productSummary.push(label)
        productDetails.shipping_option = label
      }
    } else {
      console.log('=== SHIPPING FALLBACK TRIGGERED ===')
      console.log('No shipping option found at all')
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
        shipping_speed: formData.shippingOption || 'not_selected',
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
