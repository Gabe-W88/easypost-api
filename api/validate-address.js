import EasyPost from '@easypost/api'

const easypost = new EasyPost(process.env.EASYPOST_API_KEY)

export default async function handler(req, res) {
  // Enable CORS for your Framer domain
  res.setHeader('Access-Control-Allow-Origin', 'https://fastidp2025.framer.website')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { street1, street2, city, state, zip, country } = req.body

    // Validate required fields
    if (!street1 || !city || !state || !zip) {
      res.status(400).json({ 
        error: 'Missing required fields: street1, city, state, zip' 
      })
      return
    }

    // Create address object for EasyPost
    const addressData = {
      street1,
      street2: street2 || '',
      city,
      state,
      zip,
      country: country || 'US'
    }

    // Verify address with EasyPost
    const address = await easypost.Address.create(addressData)
    
    const response = {
      deliverable: address.verifications?.delivery?.success || false,
      verifiedAddress: {
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country
      },
      suggestions: [],
      errors: address.verifications?.delivery?.errors || []
    }

    // If address has issues, provide suggestions
    if (!response.deliverable && address.verifications?.delivery?.details) {
      const details = address.verifications.delivery.details
      
      // Create suggestions based on EasyPost corrections
      if (details.latitude && details.longitude) {
        response.suggestions.push({
          street1: address.street1,
          street2: address.street2,
          city: address.city,
          state: address.state,
          zip: address.zip,
          country: address.country
        })
      }
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('EasyPost validation error:', error)
    res.status(500).json({ 
      error: 'Address validation failed',
      details: error.message 
    })
  }
}
