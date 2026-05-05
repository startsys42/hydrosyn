import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    
    const { email, system_id } = await req.json();
    
    if (!email || !system_id) {
      return new Response(JSON.stringify({
        error: 'Email y system_id requeridos'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    
    const { data: adminUserData, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_active')
      .eq('user', userData.id)
      .single();

    if (adminError || !adminUserData) {
      return new Response(JSON.stringify({
        error: 'Usuario no es administrador'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (!adminUserData.is_active) {
      return new Response(JSON.stringify({
        error: 'El administrador no está activo'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    
    const { data: systemData, error: systemError } = await supabaseAdmin
      .from('systems')
      .select('id, admin')
      .eq('id', system_id)
      .single();

    if (systemError || !systemData) {
      return new Response(JSON.stringify({
        error: 'Sistema no encontrado'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    if (systemData.admin !== userData.id) {
      return new Response(JSON.stringify({
        error: 'No tienes permisos sobre este sistema'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

        
    
    const { data: roleCheck, error: roleCheckError } = await supabaseAdmin
      .from('roles')
      .select('user')
      .eq('user', userData.id)
      .single();

    
    if (roleCheckError || !roleCheck) {
      console.log('Admin NO está en roles - aplicando límite de 5 usuarios');
      
      
      const { data: adminSystems, error: systemsError } = await supabaseAdmin
        .from('systems')
        .select('id')
        .eq('admin', userData.id);

      if (systemsError) {
        return new Response(JSON.stringify({
          error: 'Error al verificar sistemas del administrador'
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      if (adminSystems && adminSystems.length > 0) {
        const systemIds = adminSystems.map(s => s.id);
        
        
        const { data: existingUsers, error: countError } = await supabaseAdmin
          .from('systems_users')
          .select('user_id')
          .in('system', systemIds);

        if (countError) {
          return new Response(JSON.stringify({
            error: 'Error al contar usuarios existentes'
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        
        const uniqueUsers = new Set(existingUsers?.map(u => u.user_id) || []);
        
        if (uniqueUsers.size >= 5) {
          return new Response(JSON.stringify({
            error: 'Límite alcanzado: máximo 5 usuarios distintos entre todos tus sistemas'
          }), {
            status: 403,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }
      }
    } else {
      console.log('Admin ESTÁ en roles - SIN límite de usuarios');
    }
    
    let userId: string;
    let password: string | null = null;
    let isNewUser = false;
    let emailSent = false;
    let emailSubject = '';
    let emailContent = '';
    let systemUserData: any = null;



const { data: allUsers, error: fetchUsersError } = await supabaseAdmin.auth.admin.listUsers();

if (fetchUsersError) {
  console.error('Error listando usuarios:', fetchUsersError);
}


let existingUser = null;
if (allUsers && allUsers.users) {
  existingUser = allUsers.users.find(user => user.email === email);
  console.log('Buscando usuario con email:', email);
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

      
      const { error: insertSystemUserError } = await supabaseAdmin
        .from("systems_users")
        .insert({
          system: system_id,
          user_id: userId,
          is_active: true,
          associated_at: new Date().toISOString()
        });

      if (insertSystemUserError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({
          error: `Error al asociar usuario al sistema: ${insertSystemUserError.message}`
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }

      systemUserData = { is_active: true };
      emailSubject = 'Bienvenido al sistema de Hydrosyn';
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">¡Bienvenido a Hydrosyn!</h2>
          <p>Hola,</p>
          <p>Has sido agregado al sistema de gestión de Hydrosyn.</p>
          <p><strong>Detalles de tu cuenta:</strong></p>
          <div style="background-color: #f7fafc; border-left: 4px solid #2c5282; padding: 12px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0 0 0;"><strong>Contraseña temporal:</strong> ${password}</p>

          </div>
          <p>Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('APP_URL')}" 
               style="background-color: #2c5282; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Iniciar Sesión
            </a>
          </div>
          <p>Saludos,<br><strong>Equipo Hydrosyn</strong></p>
        </div>
      `;
      emailSent = true;

    } else {
      
      userId = existingUser.id;

      
      const { data: systemUserCheck, error: systemUserError } = await supabaseAdmin
        .from('systems_users')
        .select('id, is_active')
        .eq('system', system_id)
        .eq('user_id', userId)
        .single();

      if (systemUserError && systemUserError.code !== 'PGRST116') {
        throw new Error(`Error al verificar usuario en sistema: ${systemUserError.message}`);
      }

      systemUserData = systemUserCheck;

      if (!systemUserData) {
        
        const { error: insertSystemUserError } = await supabaseAdmin
          .from('systems_users')
          .insert({
            system: system_id,
            user_id: userId,
            is_active: true,
            associated_at: new Date().toISOString()
          });

        if (insertSystemUserError) {
          return new Response(JSON.stringify({
            error: `Error al agregar usuario al sistema: ${insertSystemUserError.message}`
          }), {
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        }

        systemUserData = { is_active: true };
        emailSubject = 'Has sido agregado a un nuevo sistema en Hydrosyn';
        emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5282;">¡Nuevo acceso en Hydrosyn!</h2>
            <p>Hola,</p>
            <p>Has sido agregado a un nuevo sistema en Hydrosyn.</p>
            <p>Ahora puedes acceder a este sistema con tu cuenta existente.</p>
            <p>Saludos,<br><strong>Equipo Hydrosyn</strong></p>
          </div>
        `;
        emailSent = true;

      } else {
        
        if (systemUserData.is_active) {
          
          return new Response(JSON.stringify({
            user: userId,
            message: "El usuario ya está activo en este sistema",
            status: "already_active_in_system"
          }), {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          });
        } else {
          
          const { error: updateError } = await supabaseAdmin
            .from('systems_users')
            .update({ 
              is_active: true
           
            })
            .eq('id', systemUserData.id);

          if (updateError) {
            return new Response(JSON.stringify({
              error: `Error al reactivar usuario en sistema: ${updateError.message}`
            }), {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            });
          }

          systemUserData.is_active = true;
      
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
              'Authorization': `Bearer ${resendApiKey}`,
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
      user_id: userId,
      system_id: system_id,
      is_new_user: isNewUser,
      email_sent: emailSent,
      message: isNewUser ? "Usuario creado y agregado al sistema" :
        systemUserData && !systemUserData.is_active ? "Usuario reactivado en el sistema" :
          "Usuario agregado al sistema"
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