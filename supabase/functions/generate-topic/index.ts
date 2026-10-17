import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildChapterPrompt, parseChapterContent } from "../_shared/chapter-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-version, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicTitle } = await req.json();
    if (typeof topicTitle !== "string" || !topicTitle.trim()) {
      return new Response(
        JSON.stringify({ error: "مرجع الإصحاح مطلوب" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: recentTopics, error: recentTopicsError } = await supabase
      .from("topics")
      .select("verses(book, chapter)")
      .order("scheduled_for", { ascending: false, nullsFirst: false })
      .limit(200);
    if (recentTopicsError) throw recentTopicsError;

    const usedChapterReferences = [
      ...new Set(
        (recentTopics || []).flatMap((topic: any) =>
          (topic.verses || []).map((verse: any) => `${verse.book} ${verse.chapter}`)
        ),
      ),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: buildChapterPrompt(usedChapterReferences) },
          {
            role: "user",
            content: `أعدّ الإصحاح المطلوب تحديداً: "${topicTitle.trim()}". لا تستبدل الإصحاح بفكرة عامة أو مجموعة شواهد.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("AI gateway error:", response.status, await response.text());
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content) throw new Error("No AI content");

    const reading = parseChapterContent(content);
    const chapterReference = `${reading.verses[0].book} ${reading.verses[0].chapter}`;
    if (usedChapterReferences.includes(chapterReference)) {
      throw new Error(`AI selected a chapter that was already used: ${chapterReference}`);
    }

    return new Response(JSON.stringify(reading), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error preparing chapter:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "حدث خطأ",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
