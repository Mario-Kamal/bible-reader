import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCairoDateTime } from "../_shared/cairo-time.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    if (req.headers.get("Authorization") !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { kind } = await req.json();
    if (kind !== "chapter" && kind !== "verse") {
      return new Response(JSON.stringify({ error: "kind must be chapter or verse" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { date, hour } = getCairoDateTime();
    const expectedHour = kind === "chapter" ? 1 : 10;
    if (hour !== expectedHour) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Outside scheduled Cairo hour" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL is not configured");
    const supabase = createClient(supabaseUrl, serviceKey);
    let notification: { title: string; body: string; tag: string; url: string };

    if (kind === "chapter") {
      const start = `${date}T00:00:00.000Z`;
      const end = `${date}T23:59:59.999Z`;
      const { data: topic, error } = await supabase
        .from("topics")
        .select("id, title")
        .eq("is_published", true)
        .gte("scheduled_for", start)
        .lte("scheduled_for", end)
        .order("scheduled_for", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!topic) {
        return new Response(JSON.stringify({ error: `No published chapter found for ${date}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      notification = {
        title: "📖 إصحاح اليوم",
        body: topic.title,
        tag: `daily-chapter-${date}`,
        url: `/topic/${topic.id}`,
      };
    } else {
      const { data: verse, error } = await supabase
        .from("daily_verses")
        .select("book, chapter, verse_number, verse_text")
        .eq("verse_date", date)
        .maybeSingle();
      if (error) throw error;
      if (!verse) {
        return new Response(JSON.stringify({ error: `No daily verse found for ${date}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      notification = {
        title: "✨ آية اليوم",
        body: `${verse.verse_text} — ${verse.book} ${verse.chapter}:${verse.verse_number}`,
        tag: `daily-verse-${date}`,
        url: "/home",
      };
    }

    const sendResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notification),
    });
    const sendResult = await sendResponse.json();
    if (!sendResponse.ok) {
      throw new Error(`Push send failed (${sendResponse.status}): ${JSON.stringify(sendResult)}`);
    }

    return new Response(JSON.stringify({ date, kind, ...sendResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Daily notification failed:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
