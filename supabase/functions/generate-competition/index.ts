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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { topicId } = await req.json();

    // Cairo time
    const now = new Date();
    const cairoOffset = 2 * 60 * 60 * 1000;
    const cairoNow = new Date(now.getTime() + cairoOffset);
    const todayStr = cairoNow.toISOString().split("T")[0];

    // Determine the topic to generate questions for
    let topic: any;
    let verses: any[];

    if (topicId) {
      // Specific topic provided
      const { data } = await supabase.from("topics").select("*").eq("id", topicId).single();
      topic = data;
    } else {
      // Get today's topic
      const dayStart = `${todayStr}T00:00:00.000Z`;
      const dayEnd = `${todayStr}T23:59:59.999Z`;
      const { data } = await supabase
        .from("topics")
        .select("*")
        .gte("scheduled_for", dayStart)
        .lte("scheduled_for", dayEnd)
        .limit(1)
        .single();
      topic = data;
    }

    if (!topic) {
      return new Response(
        JSON.stringify({ message: "لا يوجد موضوع لتوليد أسئلة عنه" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get verses for context
    const { data: topicVerses } = await supabase
      .from("verses")
      .select("*")
      .eq("topic_id", topic.id)
      .order("order_index");
    verses = topicVerses || [];

    // Find or create this week's competition
    const weekStart = getWeekStart(cairoNow);
    const weekEnd = getWeekEnd(cairoNow);
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const weekEndStr = weekEnd.toISOString().split("T")[0];

    let { data: competition } = await supabase
      .from("competitions")
      .select("*")
      .eq("start_date", weekStartStr)
      .eq("end_date", weekEndStr)
      .limit(1)
      .maybeSingle();

    if (!competition) {
      // Create this week's competition
      const weekNum = getWeekNumber(cairoNow);
      const { data: newComp, error } = await supabase
        .from("competitions")
        .insert({
          title: `مسابقة الأسبوع ${weekNum}`,
          description: `مسابقة أسبوعية على نبوات الصوم الكبير - من ${weekStartStr} إلى ${weekEndStr}`,
          start_date: weekStartStr,
          end_date: weekEndStr,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) throw new Error(`Failed to create competition: ${error.message}`);
      competition = newComp;
      console.log("Created new competition:", competition.id);
    }

    // Check if questions already exist for this topic in this competition
    const { data: existingQ } = await supabase
      .from("questions")
      .select("id")
      .eq("topic_id", topic.id)
      .eq("competition_id", competition.id);

    if (existingQ && existingQ.length > 0) {
      console.log("Questions already exist for this topic in competition");
      return new Response(
        JSON.stringify({ message: "الأسئلة موجودة مسبقاً", count: existingQ.length }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context from topic
    const versesText = verses
      .map((v: any) => `${v.book} ${v.chapter}:${v.verse_start}${v.verse_end ? `-${v.verse_end}` : ""}: ${v.verse_text}`)
      .join("\n");

    const systemPrompt = `أنت معلم كتاب مقدس قبطي أرثوذكسي. مهمتك توليد أسئلة اختيار من متعدد عن نبوة مسيانية.

القواعد:
- 3 أسئلة عن كل نبوة
- كل سؤال له 4 خيارات (a, b, c, d)
- إجابة واحدة صحيحة فقط
- الأسئلة متنوعة: سؤال عن النبوة، سؤال عن التحقيق، سؤال عن المعنى الروحي
- مستوى الصعوبة متوسط
- اللغة عربية فصحى بسيطة

أجب بصيغة JSON فقط:
{
  "questions": [
    {
      "question_text": "نص السؤال",
      "option_a": "الخيار أ",
      "option_b": "الخيار ب",
      "option_c": "الخيار ج",
      "option_d": "الخيار د",
      "correct_answer": "a أو b أو c أو d",
      "points": 5
    }
  ]
}`;

    const userPrompt = `النبوة: ${topic.title}
الوصف: ${topic.description || ""}
التفسير: ${topic.interpretation ? topic.interpretation.substring(0, 500) : ""}

الآيات:
${versesText}

ولّد 3 أسئلة اختيار من متعدد عن هذه النبوة.`;

    const aiResponse = await fetch(
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
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No AI content");

    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonContent = jsonMatch[1];

    const parsed = JSON.parse(jsonContent.trim());

    // Insert questions
    const questionsToInsert = (parsed.questions || []).map((q: any) => ({
      topic_id: topic.id,
      competition_id: competition.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c || null,
      option_d: q.option_d || null,
      correct_answer: q.correct_answer,
      points: q.points || 5,
    }));

    const { error: insertError } = await supabase
      .from("questions")
      .insert(questionsToInsert);

    if (insertError) {
      console.error("Insert questions error:", insertError);
      throw new Error("Failed to save questions");
    }

    console.log(`Generated ${questionsToInsert.length} questions for topic ${topic.id} in competition ${competition.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        competitionId: competition.id,
        topicId: topic.id,
        questionsCount: questionsToInsert.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date);
  d.setDate(d.getDate() + 6);
  return d;
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  return Math.ceil((diff / (1000 * 60 * 60 * 24) + 1) / 7);
}
