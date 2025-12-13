import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  // Enhanced CORS configuration
  const allowedOrigins = [
    'https://fastidp.com',
    'https://www.fastidp.com',
    'http://localhost:3000',
    'https://localhost:3000'
  ]
  
  const origin = req.headers.origin
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://fastidp.com')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { couponCode } = req.body

    if (!couponCode) {
      return res.status(400).json({ error: 'Missing coupon code' })
    }

    console.log('Validating coupon code:', couponCode)

    let coupon = null
    let promotionCode = null

    // First, try to find it as a promotion code (human-readable code like "FREE")
    try {
      const promotionCodes = await stripe.promotionCodes.list({
        code: couponCode,
        active: true,
        limit: 1
      })

      if (promotionCodes.data.length > 0) {
        promotionCode = promotionCodes.data[0]
        // Get the coupon from the promotion code
        coupon = await stripe.coupons.retrieve(promotionCode.coupon.id)
        console.log('Found promotion code:', promotionCode.code, 'for coupon:', coupon.id)
      }
    } catch (promoError) {
      console.log('Not found as promotion code, trying as coupon ID...')
    }

    // If not found as promotion code, try as coupon ID directly
    if (!coupon) {
      try {
        coupon = await stripe.coupons.retrieve(couponCode)
        console.log('Found as coupon ID:', coupon.id)
      } catch (couponError) {
        return res.status(400).json({ 
          error: 'Invalid coupon code',
          valid: false,
          details: 'Coupon or promotion code not found'
        })
      }
    }

    // Check if coupon is valid
    if (!coupon.valid) {
      return res.status(400).json({ 
        error: 'Invalid coupon code',
        valid: false
      })
    }

    // Check if coupon is redeemable
    if (coupon.redeem_by && coupon.redeem_by < Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ 
        error: 'Coupon has expired',
        valid: false
      })
    }

    // Check promotion code expiry if it's a promotion code
    if (promotionCode && promotionCode.expires_at && promotionCode.expires_at < Math.floor(Date.now() / 1000)) {
      return res.status(400).json({ 
        error: 'Promotion code has expired',
        valid: false
      })
    }

    // Return coupon details
    return res.status(200).json({
      valid: true,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        percent_off: coupon.percent_off,
        amount_off: coupon.amount_off,
        currency: coupon.currency,
        duration: coupon.duration,
        duration_in_months: coupon.duration_in_months,
      },
      promotionCode: promotionCode ? promotionCode.code : null,
      promotionCodeId: promotionCode ? promotionCode.id : null // Return promotion code ID for payment intent
    })

  } catch (error) {
    console.error('Coupon validation error:', error)
    
    // Ensure CORS headers are set even in error responses
    const origin = req.headers.origin
    const allowedOrigins = [
      'https://fastidp.com',
      'https://www.fastidp.com',
      'http://localhost:3000',
      'https://localhost:3000'
    ]
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://fastidp.com')
    }
    
    // Handle Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        error: 'Invalid coupon code',
        valid: false,
        details: error.message
      })
    }
    
    return res.status(500).json({
      error: 'Failed to validate coupon',
      valid: false,
      details: error.message
    })
  }
}

