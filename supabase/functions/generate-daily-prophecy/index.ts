import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildChapterPrompt, parseChapterContent } from "../_shared/chapter-content.ts";
import { getCairoDateTime } from "../_shared/cairo-time.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseServiceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    if (req.headers.get("Authorization") !== `Bearer ${supabaseServiceKey}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestBody = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { date: todayStr, hour } = getCairoDateTime();

    if (requestBody.scheduled === true && hour !== 0) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Not midnight in Cairo" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dayStart = `${todayStr}T00:00:00.000Z`;
    const dayEnd = `${todayStr}T23:59:59.999Z`;

    const { data: existingTopic, error: existingError } = await supabase
      .from("topics")
      .select("id")
      .gte("scheduled_for", dayStart)
      .lte("scheduled_for", dayEnd)
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingTopic) {
      return new Response(
        JSON.stringify({ message: "قراءة اليوم موجودة مسبقاً", topicId: existingTopic.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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

    const systemPrompt = buildChapterPrompt(usedChapterReferences);
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `أعدّ قراءة كتابية كاملة مناسبة لتاريخ ${todayStr}. اختر إصحاحاً غير موجود في قائمة الإصحاحات السابقة، واكتب نصه كاملاً.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content) throw new Error("No AI content");

    const reading = parseChapterContent(content);
    const chapterReference = `${reading.verses[0].book} ${reading.verses[0].chapter}`;
    if (usedChapterReferences.includes(chapterReference)) {
      throw new Error(`AI selected a chapter that was already used: ${chapterReference}`);
    }

    const { data: lastTopic, error: orderError } = await supabase
      .from("topics")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orderError) throw orderError;

    const { data: newTopic, error: insertError } = await supabase
      .from("topics")
      .insert({
        title: reading.title,
        description: reading.description,
        interpretation: reading.interpretation,
        is_published: true,
        scheduled_for: dayStart,
        order_index: (lastTopic?.order_index || 0) + 1,
        points_reward: 10,
      })
      .select()
      .single();
    if (insertError) throw insertError;

    const { error: versesError } = await supabase.from("verses").insert(
      reading.verses.map((verse, index) => ({
        topic_id: newTopic.id,
        ...verse,
        order_index: index,
      })),
    );
    if (versesError) {
      console.error("Chapter verses insert error:", versesError);
      const { error: cleanupError } = await supabase
        .from("topics")
        .delete()
        .eq("id", newTopic.id);
      if (cleanupError) console.error("Failed to remove incomplete chapter:", cleanupError);
      throw new Error("Failed to save chapter verses");
    }

    for (const functionName of ["generate-competition", "generate-topic-links"]) {
      try {
        const followup = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ topicId: newTopic.id }),
        });
        if (!followup.ok) {
          console.error(`${functionName} failed:`, followup.status, await followup.text());
        }
      } catch (followupError) {
        console.error(`${functionName} request failed:`, followupError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        topicId: newTopic.id,
        chapter: chapterReference,
        date: todayStr,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in daily chapter generation:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
