import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bible topics for auto-generation
const defaultTopics = [
  "المحبة في الكتاب المقدس",
  "الإيمان والثقة بالله",
  "الصلاة وأهميتها",
  "الغفران والمسامحة",
  "السلام الداخلي",
  "الرجاء في المسيح",
  "التواضع والوداعة",
  "الحكمة الإلهية",
  "الشكر والامتنان",
  "القوة في الضعف",
  "الخدمة والعطاء",
  "الفرح في الرب",
  "الصبر والاحتمال",
  "التوبة والرجوع لله",
  "بركات الطاعة",
  "قوة الكلمة",
  "العائلة المسيحية",
  "الأمانة في القليل",
  "النمو الروحي",
  "الشركة مع الله",
  "معجزات يسوع",
  "أمثال المسيح",
  "الصوم والتقشف",
  "ملكوت السماوات",
  "الخلاص بالنعمة",
  "الروح القدس",
  "القيامة والحياة",
  "وعود الله",
  "التجديد الروحي",
  "المصالحة مع الله"
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { date } = await req.json();
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if there's already a topic for this date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingTopic, error: fetchError } = await supabase
      .from("topics")
      .select("*, verses(*)")
      .eq("is_published", true)
      .gte("scheduled_for", startOfDay.toISOString())
      .lte("scheduled_for", endOfDay.toISOString())
      .single();

    if (existingTopic) {
      return new Response(JSON.stringify({ topic: existingTopic, generated: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No topic for today - generate one using AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get count of existing topics to pick a unique one
    const { count } = await supabase.from("topics").select("*", { count: "exact", head: true });
    const topicIndex = (count || 0) % defaultTopics.length;
    const selectedTopic = defaultTopics[topicIndex];

    const systemPrompt = `أنت عالم لاهوتي متخصص في الكتاب المقدس. مهمتك هي إنشاء محتوى تعليمي عن مواضيع الإنجيل.

عندما يُعطى لك موضوع، يجب أن:
1. تجد الآيات المتعلقة من الأناجيل الأربعة (متى، مرقس، لوقا، يوحنا) وباقي الكتاب المقدس
2. تكتب كل آية بالنص الكامل بالعربية
3. تضيف تفسيراً روحياً واضحاً

أجب بصيغة JSON فقط بالشكل التالي:
{
  "title": "عنوان الموضوع بالعربية",
  "description": "وصف مختصر للموضوع",
  "interpretation": "التفسير الروحي والتأمل في الموضوع",
  "verses": [
    {
      "book": "اسم السفر",
      "chapter": رقم الإصحاح,
      "verse_start": رقم بداية الآية,
      "verse_end": رقم نهاية الآية أو null إذا آية واحدة,
      "verse_text": "نص الآية الكامل بالعربية"
    }
  ]
}

مهم جداً: أعطِ 4-8 آيات متنوعة من أسفار مختلفة. اكتب النص بالعربية الفصحى.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `أريد موضوعاً عن: ${selectedTopic}` },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI generation failed:", response.status);
      throw new Error("Failed to generate topic");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }
    
    const parsedTopic = JSON.parse(jsonContent.trim());

    // Get the next order index
    const { data: lastTopic } = await supabase
      .from("topics")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const nextOrderIndex = (lastTopic?.order_index || 0) + 1;

    // Insert the new topic
    const { data: newTopic, error: insertError } = await supabase
      .from("topics")
      .insert({
        title: parsedTopic.title,
        description: parsedTopic.description,
        interpretation: parsedTopic.interpretation,
        is_published: true,
        scheduled_for: startOfDay.toISOString(),
        order_index: nextOrderIndex,
        points_reward: 10,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert topic error:", insertError);
      throw new Error("Failed to save topic");
    }

    // Insert verses
    if (parsedTopic.verses && Array.isArray(parsedTopic.verses)) {
      const versesToInsert = parsedTopic.verses.map((verse: any, index: number) => ({
        topic_id: newTopic.id,
        book: verse.book,
        chapter: verse.chapter,
        verse_start: verse.verse_start,
        verse_end: verse.verse_end || null,
        verse_text: verse.verse_text,
        order_index: index,
      }));

      const { error: versesError } = await supabase
        .from("verses")
        .insert(versesToInsert);

      if (versesError) {
        console.error("Insert verses error:", versesError);
      }
    }

    // Fetch the complete topic with verses
    const { data: completeTopic } = await supabase
      .from("topics")
      .select("*, verses(*)")
      .eq("id", newTopic.id)
      .single();

    return new Response(JSON.stringify({ topic: completeTopic, generated: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in get-daily-topic:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});