import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json"
};

serve(async (req) => {
    
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders, status: 200 });
    }

    
    if (req.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    try {
        
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            {
                global: { headers: { Authorization: req.headers.get("Authorization")! } },
            }
        );

        
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({ error: "No autorizado" }), {
                status: 401,
                headers: corsHeaders
            });
        }

        console.log("Usuario:", user.email);

        
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { data: adminData, error: adminError } = await supabaseAdmin
            .from("admin_users")
            .select("user")
            .eq("user", user.id)
            .eq("is_active", true)
            .maybeSingle();

        if (adminError || !adminData) {
            return new Response(JSON.stringify({ error: "No eres admin activo" }), {
                status: 403,
                headers: corsHeaders
            });
        }

        
        const { data: systems, error: systemsError } = await supabaseAdmin
            .from("systems")
            .select("*")
            .eq("admin", user.id);

        if (systemsError) throw systemsError;

        
           const exportData = [];

        for (const system of systems) {
            console.log(`Exportando sistema: ${system.name} (${system.id})`);

            
            const { data: esp32 } = await supabaseAdmin
                .from("esp32")
                .select("*")
                .eq("system", system.id);

            
            const { data: tanks } = await supabaseAdmin
                .from("tanks")
                .select("*")
                .eq("system", system.id);

            
            const { data: pumps } = await supabaseAdmin
                .from("pumps")
                .select(`
                    *,
                    origin_tank:tanks!pumps_origin_fkey(*),
                    destination_tank:tanks!pumps_destination_fkey(*),
                    esp32_device:esp32(*)
                `)
                .eq("system", system.id);

            
            const { data: systemUsers } = await supabaseAdmin
                .from("systems_users")
                .select(`
                    *,
                    user_data:auth.users(email, id, raw_user_meta_data)
                `)
                .eq("system", system.id);

            
            const { data: secrets } = await supabaseAdmin
                .from("system_secrets")
                .select("*")
                .eq("system", system.id);

            
            const tankIds = tanks?.map(t => t.id) || [];
            let records = [];
            if (tankIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from("records")
                    .select(`
                        *,
                        user_data:auth.users(email, id)
                    `)
                    .in("tank", tankIds);
                records = data || [];
            }

            
            const pumpIds = pumps?.map(p => p.id) || [];
            let programming = [];
            if (pumpIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from("programming_pumps")
                    .select("*")
                    .in("pump", pumpIds);
                programming = data || [];
            }

            
            let calibration = [];
            if (pumpIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from("calibration")
                    .select(`
                        *,
                        user_data:auth.users(email, id)
                    `)
                    .in("pump", pumpIds);
                calibration = data || [];
            }

            
            let calibrate = [];
            if (pumpIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from("calibrate")
                    .select(`
                        *,
                        user_data:auth.users(email, id)
                    `)
                    .in("pump", pumpIds);
                calibrate = data || [];
            }

            
            let recordsPumps = [];
            if (pumpIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from("records_pumps")
                    .select(`
                        *,
                        user_data:auth.users(email, id)
                    `)
                    .in("pump", pumpIds);
                recordsPumps = data || [];
            }

            
            const programIds = programming?.map(p => p.id) || [];
            let executionsPumps = [];
            if (programIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from("executions_pumps")
                    .select("*")
                    .in("programming_id", programIds);
                executionsPumps = data || [];
            }

            
            const { data: lights } = await supabaseAdmin
                .from("lights")
                .select("*")
                .eq("system", system.id);

            
            const lightIds = lights?.map(l => l.id) || [];
            let programmingLights = [];
            if (lightIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from("programming_lights")
                    .select("*")
                    .in("light", lightIds);
                programmingLights = data || [];
            }

            
            let lightsHistory = [];
            if (lightIds.length > 0) {
                const { data } = await supabaseAdmin
                    .from("lights_history")
                    .select("*")
                    .in("light_id", lightIds);
                lightsHistory = data || [];
            }

            
            const { data: loginAttempts } = await supabaseAdmin
                .from("login_attempts")
                .select("*")
                .eq("user", user.id);

            exportData.push({
                system: {
                    id: system.id,
                    name: system.name,
                    created_at: system.created_at,
                    admin_id: system.admin
                },
                esp32: esp32 || [],
                tanks: tanks || [],
                pumps: pumps || [],
                system_users: systemUsers || [],
                secrets: secrets || [],
                records: records || [],
                programming_pumps: programming || [],
                calibration: calibration || [],
                calibrate: calibrate || [],
                records_pumps: recordsPumps || [],
                executions_pumps: executionsPumps || [],
                lights: lights || [],
                programming_lights: programmingLights || [],
                lights_history: lightsHistory || [],
                login_attempts: loginAttempts || []
            });
        }
        
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        
        const jsonString = JSON.stringify(exportData, null, 2);

        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: Deno.env.get("EMAIL_NOREPLY"),
                to: user.email,
                subject: `Exportación de datos - ${new Date().toLocaleDateString()}`,
                html: `
                    <h2>Exportación de datos</h2>
                    <p>Hola,</p>
                    <p>Adjunto encontrarás los datos de tus sistemas.</p>
                    <ul>
                        <li><strong>Sistemas:</strong> ${exportData.length}</li>
                        <li><strong>Fecha:</strong> ${new Date().toLocaleString()}</li>
                        <li><strong>Usuario:</strong> ${user.email}</li>
                    </ul>
                `,
                attachments: [{
                    filename: `sistemas_${new Date().toISOString().split('T')[0]}.json`,
                    content: btoa(jsonString)
                }]
            })
        });

        const emailResult = await emailResponse.json();
        console.log("Email enviado:", emailResult);

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Datos enviados a tu email",
            systemsCount: exportData.length 
        }), {
            status: 200,
            headers: corsHeaders
        });

    } catch (err) {
        console.error("Error:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
});