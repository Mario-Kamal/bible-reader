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
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const expectedText = formData.get("expectedText") as string;

    if (!audioFile || !expectedText) {
      throw new Error("Audio file and expected text are required");
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }

    // Step 1: Transcribe the audio using ElevenLabs Speech-to-Text
    const apiFormData = new FormData();
    apiFormData.append("file", audioFile);
    apiFormData.append("model_id", "scribe_v2");
    apiFormData.append("language_code", "ara");

    const transcribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: apiFormData,
    });

    if (!transcribeResponse.ok) {
      const errorText = await transcribeResponse.text();
      console.error("Transcription error:", transcribeResponse.status, errorText);
      throw new Error("Transcription failed");
    }

    const transcription = await transcribeResponse.json();
    const spokenText = transcription.text || "";

    console.log("Expected:", expectedText);
    console.log("Spoken:", spokenText);

    // Step 2: Use Lovable AI to evaluate the reading accuracy
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
