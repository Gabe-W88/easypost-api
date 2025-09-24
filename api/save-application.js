import { createClient } from '@supabase/supabase-js'

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
    
    // Extract file extension from MIME type or data URL
    let extension = 'jpg' // default
    if (file.data && file.data.includes('data:image/')) {
      const mimeType = file.data.split(';')[0].split(':')[1]
      extension = mimeType.split('/')[1]
    } else if (file.type) {
      extension = file.type.split('/')[1]
    }
    
    // Create unique filename
    const fileName = `${applicationId}/${fileType}_${i + 1}.${extension}`
    
    // Convert base64 to buffer
    const fileBuffer = base64ToBuffer(file.data)
    
    // Upload to storage
    const uploadResult = await uploadFileToStorage(
      fileBuffer, 
      fileName, 
      file.type || 'image/jpeg'
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

export default async function handler(req, res) {
  // More comprehensive CORS setup to handle various browser behaviors
  const origin = req.headers.origin
  const allowedOrigins = [
    'https://ambiguous-methodologies-053772.framer.app',
    'https://framer.app',
    'https://preview.framer.app'
  ]
  
  // Set CORS headers
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://ambiguous-methodologies-053772.framer.app')
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')
  res.setHeader('Vary', 'Origin')
  
  // Additional headers that some browsers expect
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
    const { formData, fileData } = req.body

    // Validate required form data
    if (!formData) {
      return res.status(400).json({ error: 'Form data is required' })
    }

    // Debug: Check what we're receiving

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

    // Generate unique application ID
    const applicationId = `IDP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`


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

    // Save application to database with file URLs
    const { data, error } = await supabase
      .from('applications')
      .insert({
        application_id: applicationId,
        form_data: cleanFormData,
        file_urls: fileMetadata, // Store URLs instead of base64
        payment_status: 'pending'
      })
      .select()

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
    const allowedOrigins = [
      'https://ambiguous-methodologies-053772.framer.app',
      'https://framer.app', 
      'https://preview.framer.app'
    ]
    
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    } else {
      res.setHeader('Access-Control-Allow-Origin', 'https://ambiguous-methodologies-053772.framer.app')
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

  // Add shipping cost based on category and speed
  if (formData.shippingCategory && formData.shippingOption) {
    const category = formData.shippingCategory
    const speed = formData.shippingOption
    let shippingPrice = 0
    let shippingName = ''

    // Calculate price based on category and speed
    if (category === 'international') {
      switch (speed) {
        case 'standard':
          shippingPrice = 49
          shippingName = 'International Standard Shipping (4-8 business days)'
          break
        case 'express':
          shippingPrice = 79
          shippingName = 'International Express Shipping (2-5 business days)'
          break
        default:
          shippingPrice = 49
          shippingName = 'International Standard Shipping (4-8 business days)'
      }
    } else if (category === 'domestic') {
      switch (speed) {
        case 'standard':
          shippingPrice = 9
          shippingName = 'Domestic Standard Shipping (3-5 business days)'
          break
        case 'express':
          shippingPrice = 19
          shippingName = 'Domestic Express Shipping (2 business days)'
          break
        case 'overnight':
          shippingPrice = 49
          shippingName = 'Domestic Overnight Shipping (Next business day)'
          break
        default:
          shippingPrice = 9
          shippingName = 'Domestic Standard Shipping (3-5 business days)'
      }
    } else if (category === 'military') {
      // Military shipping is always free
      shippingPrice = 0
      shippingName = 'US Military Free Shipping'
    }
    if (shippingPrice >= 0) {
      lineItems.push({
        productId: `shipping_${category}_${speed}`,
        name: shippingName,
        price: shippingPrice,
        quantity: 1
      })
      total += shippingPrice
    }
  }

  return {
    lineItems,
    total,
    subtotal: total,
    currency: 'usd'
  }
}
