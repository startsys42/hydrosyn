

import { serve } from "https:
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
   const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

  
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

 
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')


    const { newEmail } = await req.json()
    if (!newEmail) {
      return new Response(
        JSON.stringify({ error: 'New email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('user')
      .eq('user', user.id)
      .maybeSingle()

    if (!roleError && role) {
      
      return await changeEmail(supabaseAdmin, user.id, newEmail, user.email)
    }

    
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('user', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!adminError && admin) {
      
      return await changeEmail(supabaseAdmin, user.id, newEmail, user.email)
    }

    
    const { data: systemUser, error: systemError } = await supabaseAdmin
      .from('systems_users')
      .select('id, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (!systemError && systemUser) {
      
      return await changeEmail(supabaseAdmin, user.id, newEmail, user.email)
    }

    
    return new Response(
      JSON.stringify({ 
        error: 'User does not have permission to change email',
        details: 'User must be in roles table, active admin, or active system user'
      }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in verify-and-change-email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


async function changeEmail(supabaseAdmin: any, userId: string, newEmail: string, oldEmail: string) {
  try {
    
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { email: newEmail,
      email_confirm: true }
    )

    if (error) {
      throw error
    }
await sendEmailNotification(newEmail, oldEmail)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email updated successfully',
        user: data.user 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error changing email:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to change email',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}
async function sendEmailNotification(nuevoEmail: string, viejoEmail: string) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const emailFrom = Deno.env.get('EMAIL_NOREPLY')
    
    if (!resendApiKey || !emailFrom) return

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailFrom,
        to: nuevoEmail,
        subject: 'Email cambiado - Hydrosyn',
        text: `Email cambiado. Viejo: ${viejoEmail}. Nuevo: ${nuevoEmail}. Usa este nuevo email para iniciar sesión.`
      })
    })

  } catch (error) {
    
  }
}