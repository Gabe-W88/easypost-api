import EasyPost from '@easypost/api'

const easypost = new EasyPost(process.env.EASYPOST_API_KEY)

// Helper function to detect obvious ZIP code mismatches
function checkZipCodeMismatch(state, zip, city) {
  // More specific city/ZIP validation for major cities
  const cityZipRanges = {
    'Dallas': {
      'TX': ['75201', '75212', '75214', '75215', '75216', '75217', '75218', '75219', '75220', '75221', '75223', '75224', '75225', '75226', '75227', '75228', '75229', '75230', '75231', '75232', '75233', '75234', '75235', '75236', '75237', '75238', '75240', '75241', '75243', '75244', '75246', '75247', '75248', '75249', '75250', '75251', '75252', '75253', '75254', '75270', '75275', '75277', '75283', '75284', '75285', '75286', '75287', '75295']
    }
  }
  
  const zipNum = zip.substring(0, 5)
  
  // Check specific city ZIP codes if available
  if (cityZipRanges[city] && cityZipRanges[city][state]) {
    return !cityZipRanges[city][state].includes(zipNum)
  }
  
  // Fallback to broader state validation for other areas
  const stateZipRanges = {
    'TX': [73301, 88595], // Texas ZIP range
    'OK': [73001, 74966], // Oklahoma ZIP range  
    'CA': [90001, 96162], // California ZIP range
    'NY': [10001, 14925], // New York ZIP range
    'FL': [32003, 34997]  // Florida ZIP range
  }
  
  if (!stateZipRanges[state]) return false // Don't validate unknown states
  
  const zipNumInt = parseInt(zipNum)
  const [min, max] = stateZipRanges[state]
  
  return zipNumInt < min || zipNumInt > max
}

// Enhanced apartment validation function - only validate what EasyPost actually tells us
function validateApartment(originalAddress, verifiedAddress, deliveryVerification) {
  const originalApt = originalAddress.street2?.trim()
  const verifiedApt = verifiedAddress.street2?.trim()
  
  // If no apartment was provided, no validation needed
  if (!originalApt) {
    return { hasIssue: false, warning: null }
  }
  
  // Extract apartment number from various formats
  const extractAptNumber = (aptString) => {
    if (!aptString) return null
    
    // Match patterns like "517", "Apt 517", "Unit 517", "#517", etc.
    const match = aptString.match(/(?:apt|apartment|unit|ste|suite|#)?\s*([a-zA-Z0-9]+)$/i)
    return match ? match[1].toUpperCase() : aptString.toUpperCase()
  }
  
  const originalAptNum = extractAptNumber(originalApt)
  const verifiedAptNum = extractAptNumber(verifiedApt)
  
  // Case 1: EasyPost completely removed the apartment from the verified address
  // This may indicate the apartment number doesn't exist, but could also be API limitation
  if (originalAptNum && !verifiedAptNum) {
    return {
      hasIssue: true,
      warning: `EasyPost couldn't verify apartment/unit ${originalAptNum}. This may mean the unit doesn't exist, or the apartment data isn't available in their database.`
    }
  }
  
  // Case 2: EasyPost changed the apartment number significantly
  // This could indicate a correction or that the original doesn't exist
  if (originalAptNum && verifiedAptNum && originalAptNum !== verifiedAptNum) {
    // Allow for minor formatting changes (e.g., "517" vs "517")
    const normalizedOriginal = originalAptNum.replace(/[^A-Z0-9]/g, '')
    const normalizedVerified = verifiedAptNum.replace(/[^A-Z0-9]/g, '')
    
    if (normalizedOriginal !== normalizedVerified) {
      return {
        hasIssue: true,
        warning: `EasyPost changed apartment/unit number from ${originalAptNum} to ${verifiedAptNum}. Please verify which is correct.`
      }
    }
  }
  
  // Case 3: Check delivery verification errors for apartment-related issues
  if (deliveryVerification?.errors?.length > 0) {
    const aptRelatedErrors = deliveryVerification.errors.filter(error => 
      error.message?.toLowerCase().includes('apartment') ||
      error.message?.toLowerCase().includes('unit') ||
      error.message?.toLowerCase().includes('suite') ||
      error.code?.includes('APARTMENT') ||
      error.code?.includes('UNIT')
    )
    
    if (aptRelatedErrors.length > 0) {
      return {
        hasIssue: true,
        warning: `EasyPost apartment validation issue: ${aptRelatedErrors[0].message}`
      }
    }
  }
  
  // Note: We don't validate apartment numbers ourselves - only rely on what EasyPost tells us
  return { hasIssue: false, warning: null }
}

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

    // Create address object for EasyPost with verification
    const addressData = {
      street1,
      street2: street2 || '',
      city,
      state,
      zip,
      country: country || 'US',
      verify: true // Enable EasyPost's verification
    }

    // Verify address with EasyPost
    const address = await easypost.Address.create(addressData)
    
    console.log('EasyPost Address Response:', JSON.stringify(address, null, 2))
    
    // Check delivery verification results
    const deliveryVerification = address.verifications?.delivery
    const zip4Verification = address.verifications?.zip4
    
    // EasyPost's delivery verification is the authoritative source
    const isDeliverable = deliveryVerification?.success === true
    
    // Check if EasyPost made any standardizations/corrections
    const wasStandardized = address.street1 !== addressData.street1 ||
                           address.city !== addressData.city ||
                           address.state !== addressData.state ||
                           address.zip !== addressData.zip
    
    // Additional validation: Check for obvious ZIP code mismatches as backup
    const zipMismatch = !isDeliverable && checkZipCodeMismatch(address.state, address.zip, address.city)
    
    // Enhanced apartment validation
    const apartmentValidation = validateApartment(addressData, address, deliveryVerification)
    const hasApartmentIssue = apartmentValidation.hasIssue
    const apartmentWarning = apartmentValidation.warning
    
    const response = {
      deliverable: isDeliverable && !hasApartmentIssue, // Mark as non-deliverable if apartment issues
      verifiedAddress: {
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country
      },
      suggestions: [],
      errors: deliveryVerification?.errors || [],
      zipMismatch: zipMismatch,
      apartmentWarning: apartmentWarning,
      verificationDetails: {
        deliverySuccess: deliveryVerification?.success || false,
        zip4Success: zip4Verification?.success || false,
        apartmentValidation: hasApartmentIssue ? 'failed' : 'passed',
        mode: address.mode
      }
    }

    // If EasyPost made corrections/standardizations, provide them as suggestions
    if (wasStandardized && isDeliverable) {
      response.suggestions.push({
        street1: address.street1,
        street2: address.street2 || '',
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country
      })
    }
    
    // If there's an apartment issue, suggest address without apartment
    if (hasApartmentIssue && isDeliverable) {
      response.suggestions.push({
        street1: address.street1,
        street2: '', // Remove problematic apartment
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
