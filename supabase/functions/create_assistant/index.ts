import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify the request is coming from our database
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Extract the token (remove 'Bearer ' prefix)
    const token = authHeader.replace('Bearer ', '')
    
    // Verify it matches our service_role_key
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey || token !== serviceRoleKey) {
      throw new Error('Invalid authorization')
    }

    // Get the request body
    const { name, email, description, bot_id } = await req.json()

    // Create Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    )

    // TODO: Create the assistant using OpenAI API
    // For now, we'll use a placeholder ID
    const assistantId = 'asst_' + crypto.randomUUID()

    // Update the bot with the assistant ID
    const { error } = await supabaseAdmin
      .from('bots')
      .update({ assistant_id: assistantId })
      .eq('id', bot_id)

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        assistant_id: assistantId,
        message: 'Assistant created and bot updated successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 