import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Product mapping (same as create-checkout.js)
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
    const { applicationId, formData } = req.body

    // Validate required data
    if (!applicationId || !formData) {
      return res.status(400).json({ error: 'Application ID and form data required' })
    }

    console.log('Creating payment intent for application:', applicationId)
    
    // Calculate total amount based on selections
    let totalAmount = 0
    const lineItems = []
    
    // Add permit fees ($20 each)
    if (formData.selectedPermits && formData.selectedPermits.length > 0) {
      for (const permit of formData.selectedPermits) {
        const productId = STRIPE_PRODUCTS[permit]
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
                    name: product.name,
                  },
                  unit_amount: price.unit_amount,
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
    if (formData.processingOption) {
      const productId = STRIPE_PRODUCTS[formData.processingOption]
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
                  name: product.name,
                },
                unit_amount: price.unit_amount,
              },
              quantity: 1,
            })
          }
        } catch (error) {
          console.warn(`Product not found for processing: ${formData.processingOption}`, error)
        }
      }
    }
    
    // Add shipping fee
    if (formData.shippingOption) {
      const productId = STRIPE_PRODUCTS[formData.shippingOption]
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
                  name: product.name,
                },
                unit_amount: price.unit_amount,
              },
              quantity: 1,
            })
          }
        } catch (error) {
          console.warn(`Product not found for shipping: ${formData.shippingOption}`, error)
        }
      }
    }

    // Minimum amount check
    if (totalAmount < 50) { // $0.50 minimum for Stripe
      return res.status(400).json({ error: 'Order total too low' })
    }

    console.log('Total amount calculated:', totalAmount, 'cents')

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      payment_method_types: ['card'],
      metadata: {
        applicationId: applicationId,
        customer_email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
      },
      receipt_email: formData.email,
      description: `International Driving Permit Application - ${formData.firstName} ${formData.lastName}`,
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
