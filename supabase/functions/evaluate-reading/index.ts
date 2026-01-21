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
    const { spokenText, expectedText } = await req.json();

    if (!spokenText || !expectedText) {
      throw new Error("Spoken text and expected text are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Expected:", expectedText);
    console.log("Spoken:", spokenText);

    // Use Lovable AI to evaluate the reading accuracy
    const evaluationPrompt = `أنت خبير في تقييم القراءة. قارن بين النص المتوقع والنص المنطوق وقيّم دقة القراءة.

النص المتوقع:
"${expectedText}"

النص المنطوق:
"${spokenText}"

قيّم القراءة بناءً على:
1. دقة الكلمات (0-100)
2. الكلمات الصحيحة
3. الكلمات الخاطئة أو المفقودة
4. ملاحظات للتحسين

أعد الإجابة بصيغة JSON فقط بدون أي نص إضافي:
{
  "accuracy": number,
  "correctWords": number,
  "totalWords": number,
  "feedback": "string",
  "encouragement": "string"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "أنت مساعد تعليمي متخصص في تقييم القراءة باللغة العربية. أجب بصيغة JSON فقط." },
          { role: "user", content: evaluationPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI evaluation error:", aiResponse.status, errorText);
      throw new Error("Evaluation failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    let evaluation;
    
    if (jsonMatch) {
      try {
        evaluation = JSON.parse(jsonMatch[0]);
      } catch {
        evaluation = {
          accuracy: 0,
          correctWords: 0,
          totalWords: expectedText.split(/\s+/).length,
          feedback: "لم نتمكن من تقييم القراءة. حاول مرة أخرى.",
          encouragement: "استمر في المحاولة!"
        };
      }
    } else {
      evaluation = {
        accuracy: 0,
        correctWords: 0,
        totalWords: expectedText.split(/\s+/).length,
        feedback: "لم نتمكن من تقييم القراءة. حاول مرة أخرى.",
        encouragement: "استمر في المحاولة!"
      };
    }

    return new Response(JSON.stringify({
      ...evaluation,
      spokenText,
      expectedText,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
