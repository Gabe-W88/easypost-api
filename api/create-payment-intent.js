import Stripe from 'stripe'
import { PERMIT_PRICES, getCombinedPriceCents, TAX } from '../config/pricing.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://fastidp.com')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { applicationId, formData } = req.body

    if (!applicationId) {
      return res.status(400).json({ error: 'Missing applicationId' })
    }

    console.log('Creating payment intent for application:', applicationId)

    const permitCount = formData.selectedPermits?.length || 1
    const permitTotal = permitCount * PERMIT_PRICES.idp

    const category = formData.shippingCategory || 'domestic'
    const speed = formData.processingOption || 'standard'
    const combinedPrice = getCombinedPriceCents(category, speed) / 100

    const subtotal = permitTotal + combinedPrice
    const taxAmount = Math.round(subtotal * TAX.rate * 100) / 100
    const total = subtotal + taxAmount

    const amountInCents = Math.round(total * 100)

    console.log('Payment calculation:', {
      permits: permitCount,
      permitTotal,
      combinedPrice,
      subtotal,
      taxAmount,
      total,
      amountInCents
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      payment_method_types: ['card'],
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic'
        }
      },
      metadata: {
        applicationId: applicationId,
        customer_email: formData.email,
        customer_name: `${formData.firstName} ${formData.lastName}`,
        permit_count: permitCount.toString(),
        shipping_category: category,
        processing_speed: speed,
      },
      description: `IDP Application - ${applicationId}`,
    })

    console.log('Payment intent created:', paymentIntent.id)

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    console.error('Payment intent creation error:', error)
    return res.status(500).json({
      error: 'Failed to create payment intent',
      details: error.message
    })
  }
}
