import { createClient } from '@supabase/supabase-js'

// TEST: This is a test comment to verify file editing works
// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper function to convert base64 to file buffer
function base64ToBuffer(base64String) {
  // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
  const base64Data = base64String.split(',')[1] || base64String
  return Buffer.from(base64Data, 'base64')
}

// Helper function to upload file to Supabase Storage
async function uploadFileToStorage(fileBuffer, fileName, contentType, bucket = 'application-files') {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileBuffer, {
        contentType: contentType,
        upsert: true // Replace if file already exists
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw error
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return {
      path: data.path,
      publicUrl: urlData.publicUrl
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// Helper function to process and upload multiple files
async function uploadFilesToStorage(files, applicationId, fileType) {
  const uploadedFiles = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    // Check if file already has publicUrl (uploaded from frontend)
    if (file.publicUrl && file.path) {
      // File was already uploaded directly to Supabase from frontend
      uploadedFiles.push({
        originalName: file.name,
        fileName: file.path,
        path: file.path,
        publicUrl: file.publicUrl,
        size: file.size,
        type: file.type
      })
      continue
    }
    
    // Legacy support: Handle base64 uploads (if any old clients still use this)
    let extension = 'jpg' // default
    let contentType = file.type || 'image/jpeg'
    
    if (file.data && file.data.includes('data:image/')) {
      const mimeType = file.data.split(';')[0].split(':')[1]
      extension = mimeType.split('/')[1]
    } else if (file.type) {
      extension = file.type.split('/')[1]
    }
    
    // For HEIC files, keep original format
    if (file.name && (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif'))) {
      extension = 'heic'
      contentType = 'image/heic'
    }
    
    // Create unique filename
    const fileName = `${applicationId}/${fileType}_${i + 1}.${extension}`
    
    // Convert base64 to buffer
    const fileBuffer = base64ToBuffer(file.data)
    
    // Upload to storage
    const uploadResult = await uploadFileToStorage(
      fileBuffer, 
      fileName, 
      contentType
    )
    
    uploadedFiles.push({
      originalName: file.name,
      fileName: fileName,
      path: uploadResult.path,
      publicUrl: uploadResult.publicUrl,
      size: file.size,
      type: file.type
    })
  }
  
  return uploadedFiles
}

// Stripe product mapping for form selections
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

// Countries that can be processed automatically through EasyPost
const AUTOMATED_COUNTRIES = [
  'AU', // Australia
  'AT', // Austria
  'BE', // Belgium
  'CA', // Canada
  'DK', // Denmark
  'FI', // Finland
  'FR', // France
  'DE', // Germany
  'IE', // Ireland
  'IT', // Italy
  'LU', // Luxembourg
  'MX', // Mexico
  'NL', // Netherlands
  'NZ', // New Zealand
  'NO', // Norway
  'PT', // Portugal
  'ES', // Spain
  'SE', // Sweden
  'CH', // Switzerland
  'GB', // United Kingdom
]

// Country name to code mapping for parsing international addresses
const COUNTRY_NAME_TO_CODE = {
  // Automated countries - full names to codes
  'australia': 'AU',
  'austria': 'AT', 
  'belgium': 'BE',
  'canada': 'CA',
  'denmark': 'DK',
  'finland': 'FI',
  'france': 'FR',
  'germany': 'DE',
  'ireland': 'IE',
  'italy': 'IT',
  'luxembourg': 'LU',
  'mexico': 'MX',
  'netherlands': 'NL',
  'new zealand': 'NZ',
  'norway': 'NO',
  'portugal': 'PT',
  'spain': 'ES',
  'sweden': 'SE',
  'switzerland': 'CH',
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'england': 'GB',
  'scotland': 'GB',
  'wales': 'GB',
  'northern ireland': 'GB',
  
  // Common variations
  'usa': 'US',
  'united states': 'US',
  'united states of america': 'US',
  'america': 'US',
}

// Helper function to extract country from international address
function extractCountryFromAddress(internationalFullAddress) {
  if (!internationalFullAddress || typeof internationalFullAddress !== 'string') {
    return null
  }
  
  // Split address into lines and get the last non-empty line (usually the country)
  const lines = internationalFullAddress.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0)
  
  if (lines.length === 0) {
    return null
  }
  
  // Check the last line first (most common format)
  const lastLine = lines[lines.length - 1].toLowerCase().trim()
  
  // First, check if it's already a country code (2 letters)
  if (lastLine.length === 2 && /^[a-z]{2}$/.test(lastLine)) {
    return lastLine.toUpperCase()
  }
  
  // Check if the last line matches a known country name
  if (COUNTRY_NAME_TO_CODE[lastLine]) {
    return COUNTRY_NAME_TO_CODE[lastLine]
  }
  
  // If last line doesn't match, search through all lines for country mentions
  for (const line of lines.reverse()) { // Start from last line and work backwards
    const lineLower = line.toLowerCase().trim()
    
    // Check for exact country name matches
    for (const [countryName, countryCode] of Object.entries(COUNTRY_NAME_TO_CODE)) {
      if (lineLower === countryName || lineLower.includes(countryName)) {
        return countryCode
      }
    }
    
    // Check for country code (case insensitive)
    const possibleCode = line.trim().toUpperCase()
    if (possibleCode.length === 2 && /^[A-Z]{2}$/.test(possibleCode)) {
      return possibleCode
    }
  }
  
  console.log('Could not extract country from address:', internationalFullAddress)
  return null
}

// Helper function to determine fulfillment type based on shipping country
function determineFulfillmentType(shippingCategory, shippingCountry, internationalFullAddress = null) {
  // Domestic and military shipments are always automated
  if (shippingCategory === 'domestic' || shippingCategory === 'military') {
    return 'automated'
  }
  
  // For international shipments, check if country is in automated list
  if (shippingCategory === 'international') {
    let countryCode = shippingCountry
    
    // If no explicit shipping country provided, try to extract from international address
    if (!countryCode && internationalFullAddress) {
      countryCode = extractCountryFromAddress(internationalFullAddress)
      console.log('Extracted country from address:', {
        address: internationalFullAddress,
        extractedCountry: countryCode
      })
    }
    
    if (!countryCode) {
      console.log('No country found for international shipment, defaulting to manual')
      // If no country provided, default to manual for safety
      return 'manual'
    }
    
    // Check if country code is in automated list
    const isAutomated = AUTOMATED_COUNTRIES.includes(countryCode.toUpperCase())
    console.log('Country automation check:', {
      countryCode: countryCode.toUpperCase(),
      isAutomated,
      automatedCountries: AUTOMATED_COUNTRIES
    })
    
    return isAutomated ? 'automated' : 'manual'
  }
  
  // Default to manual if category is unknown
  return 'manual'
}

export default async function handler(req, res) {
  // More comprehensive CORS setup to handle various browser behaviors
  const origin = req.headers.origin
  // Previous URL (rollback): 'https://ambiguous-methodologies-053772.framer.app'
  const allowedOrigins = [
    'https://serious-flows-972417.framer.app',
    'https://framer.app',
    'https://preview.framer.app'
  ]
  
  // Set CORS headers first, before any other processing
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://serious-flows-972417.framer.app')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { applicationId, formData, fileData } = req.body

    // Validate required form data
    if (!formData) {
      return res.status(400).json({ error: 'Form data is required' })
    }
    
    // Validate application ID
    if (!applicationId) {
      return res.status(400).json({ error: 'Application ID is required' })
    }

    // Debug: Check what we're receiving
    console.log('=== SAVE APPLICATION DEBUG ===')
    console.log('All formData keys:', Object.keys(formData))
    console.log('Full formData:', JSON.stringify(formData, null, 2))
    console.log('International fields check:', {
      internationalFullAddress: formData.internationalFullAddress,
      internationalLocalAddress: formData.internationalLocalAddress, 
      internationalDeliveryInstructions: formData.internationalDeliveryInstructions
    })
    console.log('=== END DEBUG ===')

    // Validate required fields (temporarily skip shipping for debugging)
    const requiredFields = ['email', 'firstName', 'lastName', 'selectedPermits', 'processingOption']
    for (const field of requiredFields) {
      const value = formData[field]
      
      if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
        return res.status(400).json({ 
          error: `${field} is required`,
          received: value,
          type: typeof value
        })
      }
    }

    // Validate file uploads
    if (!fileData || !fileData.driversLicense || !fileData.passportPhoto) {
      return res.status(400).json({ error: 'Both driver\'s license and passport photo uploads are required' })
    }

    if (fileData.driversLicense.length === 0 || fileData.passportPhoto.length === 0) {
      return res.status(400).json({ error: 'At least one file must be uploaded for each document type' })
    }

    // Use application ID from request (generated by frontend)
    // This ensures consistency between frontend, backend, and payment intent metadata


    // Upload files to Supabase Storage
    let uploadedDriversLicense = []
    let uploadedPassportPhoto = []
    let uploadedSignature = null

    try {
      // Upload driver's license files
      uploadedDriversLicense = await uploadFilesToStorage(
        fileData.driversLicense,
        applicationId,
        'drivers_license'
      )

      // Upload passport photo files
      uploadedPassportPhoto = await uploadFilesToStorage(
        fileData.passportPhoto,
        applicationId,
        'passport_photo'
      )

      // Upload signature if present
      if (formData.signature) {
        const signatureFile = {
          data: formData.signature,
          name: 'signature.png',
          type: 'image/png',
          size: Math.round(formData.signature.length * 0.75) // Estimate base64 size
        }
        
        const signatureResult = await uploadFilesToStorage(
          [signatureFile],
          applicationId,
          'signature'
        )
        uploadedSignature = signatureResult[0] // First (and only) signature file
      }

    } catch (uploadError) {
      console.error('File upload failed:', uploadError)
      return res.status(500).json({ 
        error: 'Failed to upload files to storage',
        details: uploadError.message
      })
    }

    // Prepare file metadata for database (URLs instead of base64)
    const fileMetadata = {
      driversLicense: uploadedDriversLicense,
      passportPhoto: uploadedPassportPhoto,
      signature: uploadedSignature // Add signature metadata
    }

    // Clean form data - remove base64 signature since it's now in storage
    const cleanFormData = { ...formData }
    delete cleanFormData.signature

    // Determine fulfillment type based on shipping category and country
    const fulfillmentType = determineFulfillmentType(
      formData.shippingCategory,
      formData.shippingCountry, // This will come from the custom shipping form fields
      formData.internationalFullAddress // Pass international address for country extraction
    )

    console.log('Fulfillment determination:', {
      shippingCategory: formData.shippingCategory,
      shippingCountry: formData.shippingCountry,
      internationalFullAddress: formData.internationalFullAddress,
      fulfillmentType: fulfillmentType
    })

    // Save application to database with file URLs and international fields
    console.log('=== DATABASE INSERT DEBUG ===')
    console.log('About to insert international fields:', {
      international_full_address: formData.internationalFullAddress || null,
      international_local_address: formData.internationalLocalAddress || null,
      international_delivery_instructions: formData.internationalDeliveryInstructions || null
    })
    
    const { data, error } = await supabase
      .from('applications')
      .insert({
        application_id: applicationId,
        form_data: cleanFormData,
        file_urls: fileMetadata, // Store URLs instead of base64
        payment_status: 'pending',
        fulfillment_type: fulfillmentType, // Add fulfillment type for Make automation
        // Extract international shipping fields to individual columns
        international_full_address: formData.internationalFullAddress || null,
        international_local_address: formData.internationalLocalAddress || null,
        international_delivery_instructions: formData.internationalDeliveryInstructions || null,
        shipping_country: formData.shippingCountry || null,
        pccc_code: formData.pcccCode || null
      })
      .select()

    console.log('Database insert result:', { data, error })
    console.log('=== END DATABASE DEBUG ===')

    if (error) {
      console.error('Database error:', error)
      return res.status(500).json({ 
        error: 'Failed to save to database',
        details: error.message
      })
    }

    // Calculate pricing
    const pricing = calculatePricing(formData)

    res.status(200).json({
      success: true,
      applicationId: applicationId,
      data: data[0],
      pricing: pricing
    })

  } catch (error) {
    console.error('Save application error:', error)
    
    // Ensure CORS headers are set even in error responses
    const origin = req.headers.origin
    // Previous URL (rollback): 'https://ambiguous-methodologies-053772.framer.app'
    const allowedOrigins = [
      'https://serious-flows-972417.framer.app',
      'https://framer.app', 
      'https://preview.framer.app'
    ]
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://serious-flows-972417.framer.app')
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age', '86400')
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type')
    
    res.status(500).json({ 
      error: 'Failed to save application',
      details: error.message
    })
  }
}

// Helper function to calculate pricing
function calculatePricing(formData) {
  let total = 0
  const lineItems = []

  // Add permit costs ($20 each)
  if (formData.selectedPermits && formData.selectedPermits.length > 0) {
    formData.selectedPermits.forEach(permit => {
      if (permit === 'International Driving Permit') {
        lineItems.push({
          productId: STRIPE_PRODUCTS.idp_international,
          name: 'International Driving Permit',
          price: 20,
          quantity: 1
        })
        total += 20
      } else if (permit === 'IAPD (Brazil / Uruguay only)') {
        lineItems.push({
          productId: STRIPE_PRODUCTS.idp_brazil_uruguay,
          name: 'IAPD (Brazil / Uruguay only)',
          price: 20,
          quantity: 1
        })
        total += 20
      }
    })
  }

  // Add processing cost
  if (formData.processingOption) {
    const processing = formData.processingOption
    if (processing === 'standard') {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_standard,
        name: '3-5 Business Days Processing',
        price: 69,
        quantity: 1
      })
      total += 69
    } else if (processing === 'express') {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_express,
        name: '2 Business Days Processing',
        price: 109,
        quantity: 1
      })
      total += 109
    } else if (processing === 'same_day') {
      lineItems.push({
        productId: STRIPE_PRODUCTS.processing_same_day,
        name: 'Same-Day/Next-Day Processing',
        price: 169,
        quantity: 1
      })
      total += 169
    }
  }

  // Add combined processing & shipping cost
  if (formData.shippingCategory && formData.processingOption) {
    const category = formData.shippingCategory
    const speed = formData.processingOption
    let combinedPrice = 0
    let combinedName = ''

    // Calculate combined price based on category and speed
    if (category === 'domestic') {
      if (speed === 'standard') {
        combinedPrice = 58
        combinedName = 'Standard Processing & Shipping'
      } else if (speed === 'fast') {
        combinedPrice = 108
        combinedName = 'Fast Processing & Shipping'
      } else if (speed === 'fastest') {
        combinedPrice = 168
        combinedName = 'Fastest Processing & Shipping'
      }
    } else if (category === 'international') {
      if (speed === 'standard') {
        combinedPrice = 98
        combinedName = 'Standard Processing & Shipping'
      } else if (speed === 'fast') {
        combinedPrice = 148
        combinedName = 'Fast Processing & Shipping'
      } else if (speed === 'fastest') {
        combinedPrice = 198
        combinedName = 'Fastest Processing & Shipping'
      }
    } else if (category === 'military') {
      if (speed === 'standard') {
        combinedPrice = 49
        combinedName = 'Standard Processing & Shipping'
      } else if (speed === 'fast') {
        combinedPrice = 89
        combinedName = 'Fast Processing & Shipping'
      } else if (speed === 'fastest') {
        combinedPrice = 119
        combinedName = 'Fastest Processing & Shipping'
      }
    }
    
    if (combinedPrice > 0) {
      lineItems.push({
        productId: `processing_shipping_${category}_${speed}`,
        name: combinedName,
        price: combinedPrice,
        quantity: 1
      })
      total += combinedPrice
    }
  }

  return {
    lineItems,
    total,
    subtotal: total,
    currency: 'usd'
  }
}
