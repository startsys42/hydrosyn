import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*", 
    "Access-Control-Allow-Methods": "POST, OPTIONS", 
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json"
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

serve(async (req) => {
    try {
        
        if (req.method === "OPTIONS") {
            return new Response("ok", {
                headers: corsHeaders,
                status: 200 
            });
        }

        
        if (req.method !== "POST") {
            return new Response("Method Not Allowed", {
                status: 405,
                headers: corsHeaders
            });
        }

        
        
        const { email } = await req.json();
        console.error("Email recibido:", email);

        if (!email) {
            return new Response("Missing email", {
                status: 400,
                headers: corsHeaders
            });
        }

        const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

        const { data, error: userErr } = await supabase.auth.admin.listUsers();

        if (userErr || !data?.users) {
            throw userErr;
        }

        const user = data.users.find(u => u.email === email);
        console.error("Usuario encontrado:", user ? user.id : "No encontrado");

        if (userErr) {
            console.error("Error al buscar usuario:", userErr.message);
            return new Response("Internal Server Error", {
                status: 500,
                headers: corsHeaders
            });
        }

        if (!user) {
            
            return new Response(JSON.stringify({
                success: true
            }), {
                status: 200,
                headers: corsHeaders
            });
        }

        const userId = user.id;

        const { data: role } = await supabase.from("roles").select("user").eq("user", userId).maybeSingle();
        const { data: admin } = await supabase.from("admin_users").select("user, is_active").eq("user", userId).eq("is_active", true).maybeSingle();
        const { data: systemUser } = await supabase.from("systems_users").select("user_id, is_active").eq("user_id", userId).eq("is_active", true).maybeSingle();

        if (role || admin || systemUser) {
            const newPassword = generarPassword();


            const { error: updateErr } =
                await supabase.auth.admin.updateUserById(userId, {
                    password: newPassword
                });

            if (updateErr) throw updateErr;


            await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    from: Deno.env.get("EMAIL_NOREPLY"),
                    to: email,
                    subject: "Recuperación de contraseña",
                    html: `
          <p>Hola,</p>
          <p>Tu contraseña ha sido restablecida.</p>
          <p><strong>Nueva contraseña:</strong> ${newPassword}</p>
          <p>Te recomendamos cambiarla al iniciar sesión.</p>
        `
                })
            });
            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: corsHeaders
            });
        }

        
        const { error: insertErr } = await supabase.from("login_attempts").insert({
            user: userId,
            reason: 'Password recovery attempt for an inactive user'
        });

        if (insertErr) console.error("Error al registrar intento:", insertErr);
        else console.log("Intento registrado para usuario inactivo:", userId);

        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: corsHeaders
        });
    } catch (err) {
        console.error("Error inesperado:", err);
        return new Response("Internal Server Error", {
            status: 500,
            headers: corsHeaders
        });
    }
});


