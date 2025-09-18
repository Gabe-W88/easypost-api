import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Enable CORS for Framer domain
  res.setHeader('Access-Control-Allow-Origin', 'https://ambiguous-methodologies-053772.framer.app')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { applicationId } = req.query

    if (!applicationId) {
      return res.status(400).json({ error: 'applicationId required' })
    }

    console.log('Testing database query for application:', applicationId)

    // Try to find the application
    const { data: findData, error: findError } = await supabase
      .from('applications')
      .select('*')
      .eq('application_id', applicationId)
      .single()

    console.log('Find result:', { data: findData, error: findError })

    if (findError) {
      return res.status(404).json({ 
        error: 'Application not found', 
        details: findError,
        searchedFor: applicationId
      })
    }

    // Try to update it
    const { data: updateData, error: updateError } = await supabase
      .from('applications')
      .update({
        payment_status: 'test_completed',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)
      .select()
      .single()

    console.log('Update result:', { data: updateData, error: updateError })

    res.status(200).json({
      success: true,
      applicationId,
      findResult: { data: findData, error: findError },
      updateResult: { data: updateData, error: updateError }
    })

  } catch (error) {
    console.error('Debug test error:', error)
    
    // Ensure CORS headers are set even in error responses
    res.setHeader('Access-Control-Allow-Origin', 'https://ambiguous-methodologies-053772.framer.app')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    
    res.status(500).json({ error: error.message })
  }
}
