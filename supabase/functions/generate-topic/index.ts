import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topicTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
          { role: "user", content: `أريد موضوعاً عن: ${topicTitle}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز الحد المسموح، حاول لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للاستمرار" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

    // Extract JSON from response (might be wrapped in markdown code blocks)
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
      JSON.stringify({ error: error instanceof Error ? error.message : "حدث خطأ" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
