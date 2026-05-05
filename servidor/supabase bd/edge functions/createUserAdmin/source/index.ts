import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function generarPassword() {
  const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const allChars = letters + numbers;
  const length = 10;

  let passwordChars: string[] = [];

  
  while (passwordChars.filter(c => letters.includes(c)).length < 3) {
    const char = letters.charAt(Math.floor(Math.random() * letters.length));
    if (!passwordChars.includes(char)) {
      passwordChars.push(char);
    }
  }

  
  while (passwordChars.filter(c => numbers.includes(c)).length < 2) {
    const char = numbers.charAt(Math.floor(Math.random() * numbers.length));
    if (!passwordChars.includes(char)) {
      passwordChars.push(char);
    }
  }

  
  while (passwordChars.length < length) {
    passwordChars.push(allChars.charAt(Math.floor(Math.random() * allChars.length)));
  }

  
  passwordChars = passwordChars.sort(() => 0.5 - Math.random());

  return passwordChars.join('');
}

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Método no permitido', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader) {
      return new Response(JSON.stringify({
        error: 'Falta el token de autorización'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: {
            authorization: token
          }
        }
      }
    );

    const authUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/user`;
    const authResponse = await fetch(authUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      }
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      return new Response(JSON.stringify({
        error: 'Token inválido',
        details: errorData.error_description || 'Error al validar el token'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    const userData = await authResponse.json();
    console.log('Usuario validado:', userData.id);

    
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('user')
      .eq('user', userData.id)
      .single();

    if (roleError || !roleData) {
      return new Response(JSON.stringify({
        error: 'No autorizado, el usuario no tiene rol de admin'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email requerido'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    
    let userId: string;
    let password: string | null = null;
    let isNewUser = false;
    let emailSent = false;
    let emailSubject = '';
    let emailContent = '';
    let adminUserData: any = null;

    
    
    const { data: authUsers, error: fetchUserError } = await supabaseAdmin.auth.admin.listUsers();

if (fetchUserError) {
  console.error('Error listando usuarios:', fetchUserError);
  
}


let existingUser = null;
if (authUsers && authUsers.users) {
  existingUser = authUsers.users.find(user => user.email === email);
  console.log('Usuario encontrado?', !!existingUser);
}


    if (!existingUser) {
      
      isNewUser = true;
      password = generarPassword();
      console.log('Nueva contraseña:', password);

      const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
console.log('=== RESULTADO CREATEUSER ===');
console.log('¿Tiene error?', !!createError);
console.log('Error:', createError);
console.log('¿Tiene data?', !!newUserData);
console.log('Data completa:', JSON.stringify(newUserData, null, 2));
console.log('Keys en data:', newUserData ? Object.keys(newUserData) : 'no data');
      if (createError) {
        return new Response(JSON.stringify({
          error: `Error al crear usuario: ${createError.message}`
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      userId = newUserData.user.id;

      
      const { error: insertAdminError } = await supabaseAdmin
        .from("admin_users")
        .insert({
          user: userId,
          is_active: true
        });

      if (insertAdminError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({
          error: `Error al registrar admin: ${insertAdminError.message}`
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      adminUserData = { is_active: true };
      emailSubject = 'Tu nueva cuenta y contraseña en Hydrosyn';
      emailContent = `<p>Hola,</p>
        <p>Tu cuenta ha sido creada como administrador en Hydrosyn.</p>
        <p><strong>Contraseña temporal:</strong> ${password}</p>
        <p>Por favor, cambia tu contraseña después de iniciar sesión.</p>
        <p>Saludos,<br>Equipo Hydrosyn</p>`;
      emailSent = true;

    } else {
      
      userId = existingUser.id;

      
      const { data: adminCheckData, error: adminCheckError } = await supabaseAdmin
        .from('admin_users')
        .select('id, is_active')
        .eq('user', userId)
        .single();

      if (adminCheckError && adminCheckError.code !== 'PGRST116') {
        throw new Error(`Error al verificar admin: ${adminCheckError.message}`);
      }

      adminUserData = adminCheckData;

      if (!adminUserData) {
        
        const { error: insertAdminError } = await supabaseAdmin
          .from('admin_users')
          .insert({
            user: userId,
            is_active: true
          });

        if (insertAdminError) {
          return new Response(JSON.stringify({
            error: `Error al agregar como admin: ${insertAdminError.message}`
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        adminUserData = { is_active: true };
        emailSubject = 'Ahora eres administrador en Hydrosyn';
        emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">¡Bienvenido como Administrador!</h2>
          <p>Hola,</p>
          <p>Tu cuenta ha sido creada como administrador en Hydrosyn.</p>
          
          <div style="background-color: #f7fafc; border-left: 4px solid #2c5282; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
          
          </div>
          
          <p>Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('APP_URL')}" 
               style="display: inline-block; padding: 12px 24px; background-color: #2c5282; 
                      color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Iniciar Sesión
            </a>
          </div>
          
          <p>Saludos,<br><strong>Equipo Hydrosyn</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="color: #718096; font-size: 12px;">
            Si tienes problemas para iniciar sesión, contacta con soporte técnico.
          </p>
        </div>
      `;
        emailSent = true;

      } else {
        
        if (adminUserData.is_active) {
          
          return new Response(JSON.stringify({
            user: userId,
            message: "El usuario ya es administrador activo",
            status: "already_active_admin"
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } else {
          
          const { error: updateError } = await supabaseAdmin
            .from('admin_users')
            .update({ is_active: true })
            .eq('user', userId);

          if (updateError) {
            return new Response(JSON.stringify({
              error: `Error al reactivar admin: ${updateError.message}`
            }), {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }

          adminUserData.is_active = true;
          emailSubject = 'Tu cuenta de administrador ha sido reactivada';
          emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2c5282;">¡Acceso Reactivado!</h2>
              <p>Hola,</p>
              <p>Tu cuenta de administrador en Hydrosyn ha sido reactivada.</p>
              <p>Ahora puedes acceder nuevamente al panel de administración.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${Deno.env.get('APP_URL')}" 
                   style="display: inline-block; padding: 12px 24px; background-color: #2c5282; 
                          color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
                  Acceder al Panel
                </a>
              </div>
              
              <p>Saludos,<br><strong>Equipo Hydrosyn</strong></p>
            </div>
            `;
          emailSent = true;
        }
      }
    }

    
    if (emailSent) {
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        console.error('ERROR: RESEND_API_KEY no configurada');
        emailSent = false;
      } else {
        try {
          const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              from: Deno.env.get('EMAIL_NOREPLY'),
              to: email,
              subject: emailSubject,
              html: emailContent,
              text: emailContent.replace(/<[^>]*>/g, '') 
            })
          });

          if (!resendResponse.ok) {
            const error = await resendResponse.json();
            console.error('Error al enviar email con Resend:', error);
            
            emailSent = false;
          } else {
            console.log('Email enviado exitosamente vía Resend a:', email);
          }
        } catch (emailError) {
          console.error('Error en envío de email con Resend:', emailError);
          emailSent = false;
        }
      }
    }

    return new Response(JSON.stringify({
      user: userId,
      is_new_user: isNewUser,
      email_sent: emailSent,
      message: isNewUser ? "Usuario creado como administrador" :
        adminUserData && !adminUserData.is_active ? "Administrador reactivado" :
          "Usuario agregado como administrador"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error: any) {
    console.error('Error en la función:', error);
    return new Response(JSON.stringify({
      error: "Error interno del servidor: " + error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});