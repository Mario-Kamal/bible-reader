import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildChapterPrompt, parseChapterContent } from "../_shared/chapter-content.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date } = await req.json();
    const targetDate = typeof date === "string" ? date : new Date().toISOString().split("T")[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return new Response(
        JSON.stringify({ error: "تاريخ القراءة غير صالح" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const dayStart = `${targetDate}T00:00:00.000Z`;
    const dayEnd = `${targetDate}T23:59:59.999Z`;

    const { data: existingTopic, error: existingError } = await supabase
      .from("topics")
      .select("*, verses(*)")
      .gte("scheduled_for", dayStart)
      .lte("scheduled_for", dayEnd)
      .eq("is_published", true)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingTopic) {
      return new Response(
        JSON.stringify({ topic: existingTopic, generated: false }),
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
            content: `أعدّ قراءة كتابية كاملة لتاريخ ${targetDate}. اختر إصحاحاً غير موجود في قائمة الإصحاحات السابقة، واكتب نصه كاملاً.`,
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
      console.error("AI generation failed:", response.status, await response.text());
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
        is_published: false,
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

    const { data: completeTopic, error: completeTopicError } = await supabase
      .from("topics")
      .select("*, verses(*)")
      .eq("id", newTopic.id)
      .single();
    if (completeTopicError) throw completeTopicError;

    return new Response(
      JSON.stringify({ topic: completeTopic, generated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error preparing daily chapter:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "حدث خطأ",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
