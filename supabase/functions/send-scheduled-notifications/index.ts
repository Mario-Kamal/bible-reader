import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find unsent notifications that are due
    const { data: notifications, error } = await supabase
      .from('scheduled_notifications')
      .select('*')
      .eq('sent', false)
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({ message: 'No notifications to send' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let sentCount = 0;
    for (const notif of notifications) {
      // Call the existing send-push-notification function
      const { error: sendError } = await supabase.functions.invoke('send-push-notification', {
        body: { title: notif.title, body: notif.body },
      });

      if (!sendError) {
        await supabase
          .from('scheduled_notifications')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', notif.id);
        sentCount++;
      } else {
        console.error(`Failed to send notification ${notif.id}:`, sendError);
      }
    }

    return new Response(JSON.stringify({ sent: sentCount, total: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
