import EasyPost from '@easypost/api'

// Initialize EasyPost with your API key
const easypost = new EasyPost(process.env.EASYPOST_API_KEY)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      application_id,
      to_address,
      parcel,
      max_delivery_days = 5, // Default to 5 days if not specified
      options = {}
    } = req.body

    // Validate required fields
    if (!application_id || !to_address || !parcel) {
      return res.status(400).json({ 
        error: 'Missing required fields: application_id, to_address, parcel' 
      })
    }

    console.log(`Creating EasyPost shipping label for application: ${application_id}`)
    console.log(`Max delivery days requirement: ${max_delivery_days}`)

    // Create addresses - EasyPost will use your connected carrier accounts for FROM address
    const toAddr = await easypost.Address.create({
      name: to_address.name,
      street1: to_address.street1,
      street2: to_address.street2 || '',
      city: to_address.city,
      state: to_address.state,
      zip: to_address.zip || to_address.postal_code,
      country: to_address.country || 'US',
      phone: to_address.phone,
      email: to_address.email
    })

    console.log('Customer address created:', toAddr.id)

    // Create parcel
    const parcelObj = await easypost.Parcel.create({
      length: parcel.length,
      width: parcel.width,
      height: parcel.height,
      weight: parcel.weight
    })

    console.log('Parcel created:', parcelObj.id)

    // Create shipment (EasyPost will automatically use your connected FedEx/DHL accounts)
    const shipment = await easypost.Shipment.create({
      to_address: toAddr,
      parcel: parcelObj,
      options: {
        label_format: options.label_format || 'PDF',
        label_size: options.label_size || '4x6',
        ...options
      }
    })

    console.log('Shipment created:', shipment.id)
    console.log('Available rates from connected carriers:', shipment.rates.length)

    // Filter rates to only those that meet delivery time requirement
    const qualifyingRates = shipment.rates.filter(rate => {
      const deliveryDays = parseInt(rate.delivery_days) || 999
      return deliveryDays <= max_delivery_days
    })

    console.log(`Found ${qualifyingRates.length} rates meeting ${max_delivery_days} day requirement`)

    if (qualifyingRates.length === 0) {
      throw new Error(`No shipping rates available that meet ${max_delivery_days} day requirement`)
    }

    // Select the FASTEST rate among qualifying options
    // Sort by delivery_days (ascending), then by delivery_date if available
    const selectedRate = qualifyingRates.sort((a, b) => {
      const aDays = parseInt(a.delivery_days) || 999
      const bDays = parseInt(b.delivery_days) || 999
      
      if (aDays !== bDays) {
        return aDays - bDays // Faster delivery wins
      }
      
      // If same delivery days, sort by date (earlier is better)
      if (a.delivery_date && b.delivery_date) {
        return new Date(a.delivery_date) - new Date(b.delivery_date)
      }
      
      // If no delivery date, prefer lower rate as tiebreaker
      return parseFloat(a.rate) - parseFloat(b.rate)
    })[0]

    console.log('Selected fastest qualifying rate:', {
      service: selectedRate.service,
      carrier: selectedRate.carrier,
      rate: selectedRate.rate,
      delivery_days: selectedRate.delivery_days,
      delivery_date: selectedRate.delivery_date
    })

    // Purchase the shipment with selected rate
    const purchasedShipment = await easypost.Shipment.buy(shipment.id, {
      rate: selectedRate
    })

    console.log('Shipment purchased successfully:', purchasedShipment.id)

    // Prepare response data for Make.com
    const responseData = {
      success: true,
      application_id: application_id,
      shipment_id: purchasedShipment.id,
      tracking_code: purchasedShipment.tracking_code,
      tracking_url: purchasedShipment.tracker?.public_url || null,
      
      // Label URLs
      label_url: purchasedShipment.postage_label?.label_url,
      label_pdf_url: purchasedShipment.postage_label?.label_pdf_url,
      
      // Selected rate details
      rate: {
        service: selectedRate.service,
        carrier: selectedRate.carrier,
        rate: selectedRate.rate,
        currency: selectedRate.currency,
        delivery_days: selectedRate.delivery_days,
        delivery_date: selectedRate.delivery_date,
        estimated_delivery: selectedRate.est_delivery_date
      },
      
      // Address confirmation
      addresses: {
        to: {
          name: toAddr.name,
          street1: toAddr.street1,
          street2: toAddr.street2,
          city: toAddr.city,
          state: toAddr.state,
          zip: toAddr.zip
        }
      },
      
      // Timestamps
      created_at: purchasedShipment.created_at,
      purchased_at: new Date().toISOString()
    }

    console.log(`Fastest shipping label created for application ${application_id}:`)
    console.log(`- Carrier: ${selectedRate.carrier}`)
    console.log(`- Service: ${selectedRate.service}`)
    console.log(`- Delivery: ${selectedRate.delivery_days} days`)
    console.log(`- Tracking: ${purchasedShipment.tracking_code}`)

    res.status(200).json(responseData)

  } catch (error) {
    console.error('EasyPost shipping label creation failed:', error)
    
    // Return detailed error information
    const errorResponse = {
      success: false,
      error: error.message,
      error_code: error.code || 'EASYPOST_ERROR',
      application_id: req.body.application_id || null
    }

    // EasyPost specific error handling
    if (error.code) {
      switch (error.code) {
        case 'ADDRESS.VERIFY.FAILURE':
          errorResponse.error = 'Address verification failed. Please check the shipping address.'
          errorResponse.suggestion = 'Verify customer address is complete and valid'
          break
        case 'SHIPMENT.POSTAGE.FAILURE':
          errorResponse.error = 'Failed to purchase shipping label from carriers.'
          errorResponse.suggestion = 'Check EasyPost account and carrier connections'
          break
        case 'RATE.ERROR':
          errorResponse.error = 'No shipping rates available for this destination.'
          errorResponse.suggestion = 'Customer address may be in unsupported area'
          break
        default:
          errorResponse.error = `EasyPost error: ${error.message}`
      }
    }

    res.status(400).json(errorResponse)
  }
}
