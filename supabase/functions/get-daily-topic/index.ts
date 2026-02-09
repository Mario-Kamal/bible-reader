import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Messianic prophecy topics for manual admin generation
const prophecyTopics = [
  "المسيح نسل المرأة - تكوين 3:15",
  "المسيح من نسل إبراهيم - تكوين 22:18",
  "المسيح من سبط يهوذا - تكوين 49:10",
  "ميلاد المسيح من عذراء - إشعياء 7:14",
  "مولد المسيح في بيت لحم - ميخا 5:2",
  "المسيح نور الأمم - إشعياء 60:3",
  "المسيح الراعي الصالح - حزقيال 34:23",
  "عبد الرب المتألم - إشعياء 53",
  "دخول المسيح أورشليم - زكريا 9:9",
  "قيامة المسيح - مزمور 16:10",
  "صعود المسيح - مزمور 68:18",
  "المسيح كاهن على رتبة ملكي صادق - مزمور 110:4",
  "المسيح يشفي الأمراض - إشعياء 35:5-6",
  "العهد الجديد بالدم - إرميا 31:31",
  "الروح القدس يُسكب - يوئيل 2:28",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date } = await req.json();
    const targetDate = date || new Date().toISOString().split("T")[0];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if there's already a topic for this date
    const dayStart = `${targetDate}T00:00:00.000Z`;
    const dayEnd = `${targetDate}T23:59:59.999Z`;

    const { data: existingTopic } = await supabase
      .from("topics")
      .select("*, verses(*)")
      .gte("scheduled_for", dayStart)
      .lte("scheduled_for", dayEnd)
      .eq("is_published", true)
      .single();

    if (existingTopic) {
      return new Response(
        JSON.stringify({ topic: existingTopic, generated: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No topic - generate one using AI (for admin manual generation)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Pick a prophecy topic
    const { count } = await supabase.from("topics").select("*", { count: "exact", head: true });
    const topicIndex = (count || 0) % prophecyTopics.length;
    const selectedTopic = prophecyTopics[topicIndex];

    const systemPrompt = `أنت عالم لاهوتي قبطي أرثوذكسي متخصص في نبوات العهد القديم عن المسيح.
مهمتك: إنشاء محتوى يومي عن نبوة مسيانية، بأسلوب تفاسير موقع الأنبا تكلا هيمانوت.

عند إعطائك نبوة معينة:
1. اكتب آية أو آيتين من العهد القديم (النبوة) بالنص الكامل (ترجمة فاندايك)
2. اكتب آية أو آيتين من العهد الجديد (التحقيق) بالنص الكامل
3. اكتب تفسيراً روحياً أرثوذكسياً يناسب الصوم الكبير (3-5 فقرات)

أجب بصيغة JSON:
{
  "title": "عنوان النبوة",
  "description": "وصف مختصر",
  "interpretation": "التفسير الروحي...",
  "verses": [
    {
      "book": "اسم السفر",
      "chapter": رقم الإصحاح,
      "verse_start": رقم الآية,
      "verse_end": null أو رقم,
      "verse_text": "نص الآية"
    }
  ]
}

ضع آيات العهد القديم أولاً ثم العهد الجديد. 2-4 آيات إجمالاً.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `أريد نبوة عن: ${selectedTopic}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      console.error("AI generation failed:", response.status);
      throw new Error("Failed to generate prophecy");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonContent = jsonMatch[1];

    const parsedTopic = JSON.parse(jsonContent.trim());

    // Get next order index
    const { data: lastTopic } = await supabase
      .from("topics")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (lastTopic?.order_index || 0) + 1;

    // Insert as DRAFT for admin review
    const { data: newTopic, error: insertError } = await supabase
      .from("topics")
      .insert({
        title: parsedTopic.title,
        description: parsedTopic.description,
        interpretation: parsedTopic.interpretation,
        is_published: false,
        scheduled_for: `${targetDate}T00:00:00.000Z`,
        order_index: nextOrderIndex,
        points_reward: 10,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Insert verses
    if (parsedTopic.verses && Array.isArray(parsedTopic.verses)) {
      const versesToInsert = parsedTopic.verses.map(
        (verse: any, index: number) => ({
          topic_id: newTopic.id,
          book: verse.book,
          chapter: verse.chapter,
          verse_start: verse.verse_start,
          verse_end: verse.verse_end || null,
          verse_text: verse.verse_text,
          order_index: index,
        })
      );

      await supabase.from("verses").insert(versesToInsert);
    }

    // Fetch complete topic with verses
    const { data: completeTopic } = await supabase
      .from("topics")
      .select("*, verses(*)")
      .eq("id", newTopic.id)
      .single();

    return new Response(
      JSON.stringify({ topic: completeTopic, generated: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-daily-topic:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "حدث خطأ",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
