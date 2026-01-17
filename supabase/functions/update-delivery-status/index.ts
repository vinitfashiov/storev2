import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  'pending': ['assigned', 'cancelled'],
  'assigned': ['picked_up', 'cancelled'],
  'picked_up': ['delivered', 'failed'],
  'delivered': [],
  'failed': ['assigned'],
  'cancelled': [],
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { assignment_id, delivery_boy_id, new_status, notes, cod_collected, session_token } = await req.json();

    if (!assignment_id || !delivery_boy_id || !new_status) {
      return new Response(
        JSON.stringify({ error: 'assignment_id, delivery_boy_id, and new_status are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate session token if provided
    if (session_token) {
      const { data: session } = await supabase
        .from('delivery_boy_sessions')
        .select('delivery_boy_id')
        .eq('token', session_token)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (!session || session.delivery_boy_id !== delivery_boy_id) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Fetch the assignment and verify ownership
    const { data: assignment, error: fetchError } = await supabase
      .from('delivery_assignments')
      .select('*, delivery_boys!inner(id, tenant_id)')
      .eq('id', assignment_id)
      .maybeSingle();

    if (fetchError || !assignment) {
      return new Response(
        JSON.stringify({ error: 'Assignment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the delivery boy owns this assignment
    if (assignment.delivery_boy_id !== delivery_boy_id) {
      return new Response(
        JSON.stringify({ error: 'You are not assigned to this delivery' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate status transition
    const currentStatus = assignment.status;
    const allowedNextStatuses = validTransitions[currentStatus] || [];
    
    if (!allowedNextStatuses.includes(new_status)) {
      return new Response(
        JSON.stringify({ 
          error: `Cannot transition from '${currentStatus}' to '${new_status}'`,
          allowed: allowedNextStatuses 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      status: new_status,
    };

    // Set timestamps based on status
    if (new_status === 'picked_up') {
      updateData.picked_up_at = new Date().toISOString();
    } else if (new_status === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
      if (cod_collected !== undefined) {
        updateData.cod_collected = cod_collected;
      }
    }

    // Update the assignment
    const { error: updateError } = await supabase
      .from('delivery_assignments')
      .update(updateData)
      .eq('id', assignment_id);

    if (updateError) {
      console.error('Failed to update assignment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the status change
    const { error: logError } = await supabase
      .from('delivery_status_logs')
      .insert({
        tenant_id: assignment.tenant_id,
        assignment_id: assignment_id,
        delivery_boy_id: delivery_boy_id,
        old_status: currentStatus,
        new_status: new_status,
        notes: notes || null,
      });

    if (logError) {
      console.error('Failed to log status change:', logError);
      // Don't fail the request for logging errors
    }

    return new Response(
      JSON.stringify({ success: true, status: new_status }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Update delivery status error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
