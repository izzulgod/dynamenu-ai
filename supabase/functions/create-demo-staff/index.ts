import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
     // SECURITY: Get admin secret from environment - NO fallback to prevent weak auth
     const DEMO_ADMIN_SECRET = Deno.env.get('DEMO_ADMIN_SECRET');
     
     // If secret is not configured, the service is not available
     if (!DEMO_ADMIN_SECRET) {
       console.warn('[create-demo-staff] DEMO_ADMIN_SECRET not configured - service unavailable');
       return new Response(
         JSON.stringify({
           success: false,
           error: 'Service not configured. Contact administrator.',
         }),
         {
           status: 503,
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         }
       );
     }
 
    // SECURITY: Validate admin secret or authenticated admin user
    const authHeader = req.headers.get('authorization');
    const adminSecret = req.headers.get('x-admin-secret');
    
    let isAuthorized = false;
    
    // Option 1: Check for admin secret (for development/demo purposes)
    if (adminSecret === DEMO_ADMIN_SECRET) {
      isAuthorized = true;
      console.log('[create-demo-staff] Authorized via admin secret');
    }
    
    // Option 2: Check for authenticated admin user
    if (!isAuthorized && authHeader?.startsWith('Bearer ')) {
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
      
      const token = authHeader.replace('Bearer ', '');
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims?.sub) {
        // Check if user is an admin
        const { data: profile } = await supabaseAuth
          .from('staff_profiles')
          .select('role')
          .eq('user_id', claimsData.claims.sub)
          .eq('is_active', true)
          .single();
        
        if (profile?.role === 'admin') {
          isAuthorized = true;
          console.log('[create-demo-staff] Authorized via admin user:', claimsData.claims.sub);
        }
      }
    }
    
    if (!isAuthorized) {
      console.warn('[create-demo-staff] Unauthorized access attempt');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized. Admin authentication required.',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const accounts = [
      { email: 'staff@demo.com', password: 'demo1234', name: 'Kitchen Staff', role: 'kitchen' },
      { email: 'admin@demo.com', password: 'demo1234', name: 'Admin', role: 'admin' },
    ];

    const results = [];

    for (const account of accounts) {
      console.log(`[create-demo-staff] Creating/updating ${account.role} account: ${account.email}`);

      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === account.email);

      let userId: string;

      if (existingUser) {
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password: account.password,
        });
        userId = existingUser.id;
      } else {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
        });
        if (createError) throw createError;
        userId = newUser.user.id;
      }

      // Check if staff profile exists
      const { data: existingProfile } = await supabaseAdmin
        .from('staff_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await supabaseAdmin
          .from('staff_profiles')
          .insert({
            user_id: userId,
            name: account.name,
            role: account.role,
            is_active: true,
          });
        if (profileError) throw profileError;
      }

      results.push({ email: account.email, role: account.role });
    }

    console.log('[create-demo-staff] All demo accounts ready');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Demo accounts ready',
        accounts: results.map(r => ({ email: r.email, password: 'demo1234', role: r.role })),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating demo staff:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create demo staff',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
