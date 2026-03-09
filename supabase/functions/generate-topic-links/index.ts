import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { topicId } = await req.json();

    // Fetch all published topics with their verses
    const { data: topics, error: topicsError } = await supabase
      .from("topics")
      .select("id, title, description, interpretation, verses(book, chapter, verse_start, verse_end, verse_text)")
      .eq("is_published", true);

    if (topicsError) throw topicsError;
    if (!topics || topics.length < 2) {
      return new Response(JSON.stringify({ message: "Not enough topics to link" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get existing links
    const { data: existingLinks } = await supabase
      .from("topic_links")
      .select("source_topic_id, target_topic_id");

    const existingSet = new Set(
      (existingLinks || []).map((l: any) => `${l.source_topic_id}-${l.target_topic_id}`)
    );

    // If topicId provided, only generate links for that topic
    const targetTopic = topicId ? topics.find((t: any) => t.id === topicId) : null;

    // Build a summary of all topics for the AI
    const topicSummaries = topics.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description?.slice(0, 200),
      books: [...new Set((t.verses || []).map((v: any) => v.book))].join(", "),
    }));

    const prompt = targetTopic
      ? `أنت خبير في الكتاب المقدس والنبوات المسيانية. 
لديك نبوة جديدة: "${targetTopic.title}" - ${targetTopic.description?.slice(0, 300)}

وهذه قائمة بالنبوات الموجودة:
${topicSummaries.filter((t: any) => t.id !== topicId).map((t: any) => `- ID: ${t.id} | ${t.title} | الأسفار: ${t.books}`).join("\n")}

حدد النبوات المرتبطة بالنبوة الجديدة. لكل رابط، اذكر نوع العلاقة ووصف مختصر.`
      : `أنت خبير في الكتاب المقدس والنبوات المسيانية.
لديك هذه النبوات:
${topicSummaries.map((t: any) => `- ID: ${t.id} | ${t.title} | الأسفار: ${t.books}`).join("\n")}

حدد جميع الروابط المهمة بين هذه النبوات. لكل رابط، اذكر نوع العلاقة ووصف مختصر.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "أنت خبير لاهوتي متخصص في النبوات المسيانية. أجب فقط بـ JSON." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_links",
              description: "Create links between related prophecies",
              parameters: {
                type: "object",
                properties: {
                  links: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        source_id: { type: "string", description: "UUID of source topic" },
                        target_id: { type: "string", description: "UUID of target topic" },
                        relationship_type: {
                          type: "string",
                          enum: ["fulfillment", "parallel", "continuation", "contrast", "typology"],
                          description: "Type: fulfillment=تحقيق, parallel=تشابه, continuation=استمرار, contrast=تضاد, typology=رمز"
                        },
                        description: { type: "string", description: "Brief Arabic description of the relationship" },
                      },
                      required: ["source_id", "target_id", "relationship_type", "description"],
                    },
                  },
                },
                required: ["links"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_links" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { links } = JSON.parse(toolCall.function.arguments);

    // Validate IDs exist
    const topicIds = new Set(topics.map((t: any) => t.id));
    const validLinks = (links || []).filter(
      (l: any) =>
        topicIds.has(l.source_id) &&
        topicIds.has(l.target_id) &&
        l.source_id !== l.target_id &&
        !existingSet.has(`${l.source_id}-${l.target_id}`) &&
        !existingSet.has(`${l.target_id}-${l.source_id}`)
    );

    if (validLinks.length > 0) {
      const rows = validLinks.map((l: any) => ({
        source_topic_id: l.source_id,
        target_topic_id: l.target_id,
        relationship_type: l.relationship_type,
        description: l.description,
      }));

      const { error: insertError } = await supabase
        .from("topic_links")
        .upsert(rows, { onConflict: "source_topic_id,target_topic_id" });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ message: "Links generated", count: validLinks.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
