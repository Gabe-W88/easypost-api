import EasyPost from '@easypost/api'

const easypost = new EasyPost(process.env.EASYPOST_API_KEY)

export default async function handler(req, res) {
  // Enable CORS for all origins (you can restrict this later)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

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
    
    console.log('EasyPost Address Response:', JSON.stringify(address, null, 2))
    
    // Check delivery verification
    const deliveryVerification = address.verifications?.delivery
    
    // More practical approach: If EasyPost can process the address without errors,
    // and returns structured address data, consider it valid
    const hasValidAddress = address.street1 && address.city && address.state && address.zip
    const hasNoErrors = !deliveryVerification?.errors || deliveryVerification.errors.length === 0
    
    // Check if EasyPost made any standardizations
    const wasStandardized = address.street1 !== addressData.street1 ||
                           address.city !== addressData.city ||
                           address.state !== addressData.state ||
                           address.zip !== addressData.zip
    
    // Consider address deliverable if:
    // 1. EasyPost delivery verification passed, OR
    // 2. EasyPost returned a valid structured address without errors
    const isDeliverable = deliveryVerification?.success === true || 
                         (hasValidAddress && hasNoErrors)
    
    const response = {
      deliverable: isDeliverable,
      verifiedAddress: {
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country
      },
      suggestions: [],
      errors: deliveryVerification?.errors || []
    }

    // If EasyPost made corrections, provide the standardized address as a suggestion
    if (wasStandardized) {
      response.suggestions.push({
        street1: address.street1,
        street2: address.street2 || '',
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country
      })
    }

    res.status(200).json(response)

  } catch (error) {
    console.error('EasyPost validation error:', error)
    
    // Handle rate limiting specifically
    if (error.message && error.message.includes('rate-limited')) {
      res.status(429).json({ 
        error: 'Rate limit exceeded',
        details: 'Your EasyPost account has been rate-limited. Please try again later or contact EasyPost support.'
      })
      return
    }
    
    // Handle other API errors
    if (error.message && error.message.includes('INVALID_PARAMETER')) {
      res.status(400).json({ 
        error: 'Invalid address format',
        details: 'Please check your address and try again.'
      })
      return
    }
    
    res.status(500).json({ 
      error: 'Address validation failed',
      details: error.message 
    })
  }
}
