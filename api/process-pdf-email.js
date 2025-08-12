import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      application_id,
      pdf_url,
      recipient_email,
      pdf_type = 'idp_document', // 'idp_document', 'receipt', 'shipping_label'
      email_template = 'default'
    } = req.body

    // Validate required fields
    if (!application_id || !pdf_url || !recipient_email) {
      return res.status(400).json({ 
        error: 'Missing required fields: application_id, pdf_url, recipient_email' 
      })
    }

    console.log('Processing PDF email for application:', application_id)

    // Get application details from database
    const { data: application, error: dbError } = await supabase
      .from('applications')
      .select('*')
      .eq('application_id', application_id)
      .single()

    if (dbError || !application) {
      console.error('Failed to fetch application:', dbError)
      return res.status(404).json({ error: 'Application not found' })
    }

    const formData = JSON.parse(application.form_data)

    // Prepare email data based on PDF type
    const emailData = {
      application_id,
      recipient_email,
      recipient_name: `${formData.firstName} ${formData.lastName}`,
      pdf_url,
      pdf_type,
      email_template,
      
      // Application details for email template
      application_details: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        selected_permits: formData.selectedPermits || [],
        processing_option: formData.processingOption,
        shipping_option: formData.shippingOption,
        payment_amount: application.payment_amount || 0,
        created_at: application.created_at,
        tracking_code: application.tracking_code || null
      },
      
      // Email content based on type
      email_content: getEmailContent(pdf_type, formData, application),
      
      // Timestamp
      sent_at: new Date().toISOString()
    }

    // TODO: This would be handled by Make.com's email modules
    // For now, we'll just log what would be sent and return success
    console.log('Email data prepared for Make.com:', JSON.stringify(emailData, null, 2))

    // Update application with PDF info
    const updateData = {}
    
    switch (pdf_type) {
      case 'idp_document':
        updateData.idp_document_pdf_url = pdf_url
        updateData.idp_document_sent_at = new Date().toISOString()
        break
      case 'receipt':
        updateData.receipt_pdf_url = pdf_url
        updateData.receipt_sent_at = new Date().toISOString()
        break
      case 'shipping_label':
        updateData.shipping_label_pdf_url = pdf_url
        updateData.shipping_label_sent_at = new Date().toISOString()
        break
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('application_id', application_id)

    if (updateError) {
      console.error('Failed to update application with PDF info:', updateError)
    }

    // In a real implementation, Make.com would handle the actual email sending
    // This endpoint just prepares the data and confirms the PDF is ready
    
    res.status(200).json({
      success: true,
      message: `${pdf_type} PDF prepared for email delivery`,
      application_id,
      recipient_email,
      pdf_url,
      email_data: emailData
    })

  } catch (error) {
    console.error('PDF email processing failed:', error)
    res.status(500).json({ 
      success: false,
      error: error.message,
      application_id: req.body.application_id || null
    })
  }
}

// Helper function to generate email content based on PDF type
function getEmailContent(pdfType, formData, application) {
  const customerName = `${formData.firstName} ${formData.lastName}`
  
  switch (pdfType) {
    case 'idp_document':
      return {
        subject: `Your International Driving Permit - Application #${application.application_id}`,
        greeting: `Dear ${customerName},`,
        body: `
          Your International Driving Permit application has been processed and approved!
          
          Your IDP document is attached to this email. Please print it on high-quality paper and carry it along with your domestic driver's license when traveling abroad.
          
          Application Details:
          - Application ID: ${application.application_id}
          - Permits: ${formData.selectedPermits ? formData.selectedPermits.join(', ') : 'Standard IDP'}
          - Processing: ${formData.processingOption}
          
          Important Notes:
          - This permit is valid for one year from the issue date
          - You must carry your original domestic license alongside this permit
          - This permit is recognized in over 150 countries worldwide
          
          Thank you for choosing FastIDP!
        `,
        closing: 'Safe travels!',
        signature: 'The FastIDP Team'
      }
      
    case 'receipt':
      return {
        subject: `Payment Receipt - Application #${application.application_id}`,
        greeting: `Dear ${customerName},`,
        body: `
          Thank you for your payment! Your International Driving Permit application is now being processed.
          
          Payment Details:
          - Application ID: ${application.application_id}
          - Amount Paid: $${application.payment_amount}
          - Processing Option: ${formData.processingOption}
          - Shipping Option: ${formData.shippingOption}
          
          Your application is currently being reviewed and processed. You will receive your IDP document via email shortly.
          
          If you have any questions, please don't hesitate to contact our support team.
        `,
        closing: 'Thank you for your business!',
        signature: 'The FastIDP Team'
      }
      
    case 'shipping_label':
      return {
        subject: `Shipping Confirmation - Application #${application.application_id}`,
        greeting: `Dear ${customerName},`,
        body: `
          Your International Driving Permit has been shipped!
          
          Shipping Details:
          - Application ID: ${application.application_id}
          - Tracking Number: ${application.tracking_code || 'Available soon'}
          - Shipping Method: ${formData.shippingOption}
          
          The attached shipping label shows the details of your package. You can track your shipment using the tracking number provided.
          
          Estimated delivery time varies by shipping method selected.
        `,
        closing: 'Thank you for choosing FastIDP!',
        signature: 'The FastIDP Shipping Team'
      }
      
    default:
      return {
        subject: `Document Ready - Application #${application.application_id}`,
        greeting: `Dear ${customerName},`,
        body: `Your requested document is ready and attached to this email.`,
        closing: 'Thank you!',
        signature: 'The FastIDP Team'
      }
  }
}
