import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch used verses to avoid repetition
    const { data: pastVerses } = await supabase
      .from("verses")
      .select("book, chapter, verse_start")
      .limit(500);
    
    const usedVerseRefs = pastVerses?.map(v => `${v.book} ${v.chapter}:${v.verse_start}`).join(", ") || "لا يوجد";

    const systemPrompt = `أنت عالم لاهوتي قبطي أرثوذكسي متخصص في نبوات العهد القديم عن المسيح.
مهمتك: إنشاء محتوى عن نبوة مسيانية بأسلوب تفاسير موقع الأنبا تكلا هيمانوت.

عند إعطائك نبوة أو موضوع:
1. اكتب آية أو آيتين من العهد القديم (النبوة) بالنص الكامل (ترجمة فاندايك)
2. اكتب آية أو آيتين من العهد الجديد (التحقيق) بالنص الكامل
3. اكتب تفسيراً روحياً أرثوذكسياً يناسب الصوم الكبير (3-5 فقرات)
   - اشرح النبوة وكيف تحققت في المسيح
   - اذكر تعليقات آباء الكنيسة إن أمكن

**هام جداً لمنع التكرار**:
الآيات المذكورة أدناه تم استخدامها سابقاً في أيام أخرى، **يجب عليك اختيار آيات/شواهد مختلفة تماماً** حتى لو كانت لنفس الموضوع:
${usedVerseRefs}

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
      "verse_text": "نص الآية الكامل"
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
            { role: "user", content: `أريد نبوة عن: ${topicTitle}` },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const parsedTopic = JSON.parse(jsonContent.trim());

    return new Response(JSON.stringify(parsedTopic), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating topic:", error);
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
