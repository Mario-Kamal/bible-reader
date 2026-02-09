import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Sequence start date - Feb 9, 2026
const SEQUENCE_START = "2026-02-09";

// 62 Messianic prophecies for Great Lent (Feb 9 - Apr 12, 2026)
// Based on the prophecy section of "Evidence That Demands a Verdict" (برهان يتطلب قرار) by Josh McDowell
const prophecies = [
  // Week 1-2: Origins and Lineage
  { title: "المسيح نسل المرأة", hint: "النبوة: تكوين 3:15 | التحقيق: غلاطية 4:4" },
  { title: "المسيح من نسل إبراهيم", hint: "النبوة: تكوين 22:18 | التحقيق: متى 1:1، غلاطية 3:16" },
  { title: "تتبارك فيه جميع الأمم", hint: "النبوة: تكوين 12:3 | التحقيق: غلاطية 3:8" },
  { title: "المسيح من نسل إسحق", hint: "النبوة: تكوين 21:12 | التحقيق: لوقا 3:34، عبرانيين 11:18" },
  { title: "المسيح من نسل يعقوب", hint: "النبوة: عدد 24:17 | التحقيق: لوقا 3:34" },
  { title: "المسيح من سبط يهوذا", hint: "النبوة: تكوين 49:10 | التحقيق: لوقا 3:33، عبرانيين 7:14" },
  { title: "نبوة شيلون - لن يزول القضيب", hint: "النبوة: تكوين 49:10 | التحقيق: يوحنا 1:45" },
  { title: "المسيح أسد سبط يهوذا", hint: "النبوة: تكوين 49:9 | التحقيق: رؤيا 5:5" },
  { title: "المسيح من نسل داود", hint: "النبوة: إرميا 23:5 | التحقيق: لوقا 3:31، رومية 1:3" },
  { title: "المسيح وارث عرش داود", hint: "النبوة: إشعياء 9:7 | التحقيق: لوقا 1:32-33" },
  { title: "غصن من جذع يسّى", hint: "النبوة: إشعياء 11:1 | التحقيق: متى 2:23" },
  { title: "نبوة بلعام عن الكوكب", hint: "النبوة: عدد 24:17 | التحقيق: متى 2:2" },
  { title: "ميلاد المسيح من عذراء", hint: "النبوة: إشعياء 7:14 | التحقيق: متى 1:22-23" },
  { title: "عمانوئيل - الله معنا", hint: "النبوة: إشعياء 7:14 | التحقيق: يوحنا 1:14، متى 1:23" },

  // Week 3-4: Birth and Early Life
  { title: "مولد المسيح في بيت لحم", hint: "النبوة: ميخا 5:2 | التحقيق: متى 2:1-6" },
  { title: "رحلة الطفل يسوع إلى مصر", hint: "النبوة: هوشع 11:1 | التحقيق: متى 2:14-15" },
  { title: "مذبحة أطفال بيت لحم", hint: "النبوة: إرميا 31:15 | التحقيق: متى 2:16-18" },
  { title: "نبوة دانيال عن السبعين أسبوعاً", hint: "النبوة: دانيال 9:24-26 | التحقيق: لوقا 3:1، غلاطية 4:4" },
  { title: "المُرسَل قبل المسيح - يوحنا المعمدان", hint: "النبوة: ملاخي 3:1 | التحقيق: متى 11:10" },
  { title: "صوت صارخ في البرية", hint: "النبوة: إشعياء 40:3 | التحقيق: متى 3:1-3" },
  { title: "المسيح نبي مثل موسى", hint: "النبوة: تثنية 18:15 | التحقيق: أعمال 3:20-22" },
  { title: "المسيح كاهن على رتبة ملكي صادق", hint: "النبوة: مزمور 110:4 | التحقيق: عبرانيين 5:5-6" },

  // Week 4-5: Ministry and Teaching
  { title: "بدء خدمة المسيح في الجليل", hint: "النبوة: إشعياء 9:1-2 | التحقيق: متى 4:13-16" },
  { title: "المسيح نور الأمم", hint: "النبوة: إشعياء 60:3 | التحقيق: أعمال 13:47-48" },
  { title: "المسيح نور العالم", hint: "النبوة: إشعياء 9:2 | التحقيق: يوحنا 8:12" },
  { title: "المسيح يُعلّم بأمثال", hint: "النبوة: مزمور 78:2 | التحقيق: متى 13:34-35" },
  { title: "المسيح يشفي الأمراض", hint: "النبوة: إشعياء 53:4 | التحقيق: متى 8:16-17" },
  { title: "المسيح يصنع معجزات", hint: "النبوة: إشعياء 35:5-6 | التحقيق: متى 9:35" },
  { title: "المسيح يحمل أحزاننا", hint: "النبوة: إشعياء 53:3 | التحقيق: يوحنا 1:11، لوقا 19:41" },
  { title: "المسيح الراعي الصالح", hint: "النبوة: حزقيال 34:23 | التحقيق: يوحنا 10:11" },
  { title: "المسيح خبز الحياة", hint: "النبوة: خروج 16:4 | التحقيق: يوحنا 6:31-35" },
  { title: "المسيح الكرمة الحقيقية", hint: "النبوة: إشعياء 5:1-7 | التحقيق: يوحنا 15:1" },
  { title: "شمس البر والشفاء في أجنحتها", hint: "النبوة: ملاخي 4:2 | التحقيق: لوقا 1:78-79" },
  { title: "المسيح يدخل الهيكل", hint: "النبوة: ملاخي 3:1 | التحقيق: متى 21:12" },

  // Week 5-6: Triumphal Entry and Betrayal
  { title: "دخول المسيح أورشليم على حمار", hint: "النبوة: زكريا 9:9 | التحقيق: متى 21:1-11" },
  { title: "حجر الزاوية المرفوض", hint: "النبوة: مزمور 118:22-23 | التحقيق: متى 21:42-43" },
  { title: "المسيح الملك العادل", hint: "النبوة: إرميا 23:5 | التحقيق: يوحنا 18:37" },
  { title: "خيانة يهوذا الصديق", hint: "النبوة: مزمور 41:9 | التحقيق: لوقا 22:47-48" },
  { title: "ثمن الخيانة ثلاثون من الفضة", hint: "النبوة: زكريا 11:12 | التحقيق: متى 26:15" },
  { title: "الفضة تُلقى في بيت الرب", hint: "النبوة: زكريا 11:13 | التحقيق: متى 27:5-7" },
  { title: "عبد الرب المتألم", hint: "النبوة: إشعياء 52:13-53:12 | التحقيق: فيلبي 2:7-8" },
  { title: "المسيح حمل الله", hint: "النبوة: إشعياء 53:7 | التحقيق: يوحنا 1:29" },

  // Week 6-7: Passion and Crucifixion
  { title: "صمت المسيح أمام المتّهمين", hint: "النبوة: إشعياء 53:7 | التحقيق: متى 27:12-14" },
  { title: "المسيح يُجلد ويُضرب", hint: "النبوة: إشعياء 50:6 | التحقيق: متى 26:67، يوحنا 19:1" },
  { title: "المسيح يُبصق عليه ويُهان", hint: "النبوة: إشعياء 50:6 | التحقيق: متى 27:30" },
  { title: "ثقبوا يديّ ورجليّ", hint: "النبوة: مزمور 22:16 | التحقيق: يوحنا 20:25-27" },
  { title: "المسيح يُصلب مع أثمة", hint: "النبوة: إشعياء 53:12 | التحقيق: متى 27:38" },
  { title: "المسيح يُستهزأ به على الصليب", hint: "النبوة: مزمور 22:7-8 | التحقيق: لوقا 23:35" },
  { title: "المسيح يُعطى خلاً ومرارة", hint: "النبوة: مزمور 69:21 | التحقيق: متى 27:34" },
  { title: "المسيح يصلّي لأجل صالبيه", hint: "النبوة: إشعياء 53:12 | التحقيق: لوقا 23:34" },
  { title: "اقتسام ثيابه وإلقاء القرعة", hint: "النبوة: مزمور 22:18 | التحقيق: يوحنا 19:23-24" },
  { title: "عظم لا يُكسر منه", hint: "النبوة: مزمور 34:20، خروج 12:46 | التحقيق: يوحنا 19:32-36" },
  { title: "طعن جنبه بالحربة", hint: "النبوة: زكريا 12:10 | التحقيق: يوحنا 19:34" },
  { title: "ظلمة على الأرض عند الصلب", hint: "النبوة: عاموس 8:9 | التحقيق: متى 27:45" },
  { title: "يُدفن في قبر غني", hint: "النبوة: إشعياء 53:9 | التحقيق: متى 27:57-60" },

  // Week 8-9: Resurrection and Glory
  { title: "العهد الجديد بالدم", hint: "النبوة: إرميا 31:31 | التحقيق: لوقا 22:20" },
  { title: "قيامة المسيح من الأموات", hint: "النبوة: مزمور 16:10 | التحقيق: أعمال 2:31" },
  { title: "صعود المسيح إلى السماء", hint: "النبوة: مزمور 68:18 | التحقيق: أعمال 1:9" },
  { title: "المسيح يجلس عن يمين الآب", hint: "النبوة: مزمور 110:1 | التحقيق: عبرانيين 1:3" },
  { title: "إرسال الروح القدس", hint: "النبوة: يوئيل 2:28 | التحقيق: أعمال 2:1-4" },
  { title: "ابن الإنسان الآتي على سحاب السماء", hint: "النبوة: دانيال 7:13-14 | التحقيق: متى 26:64" },
  { title: "الحجر المقطوع بدون يدين", hint: "النبوة: دانيال 2:34-35 | التحقيق: أفسس 2:20" },
];

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

    // Calculate today's date (Cairo time UTC+2)
    const now = new Date();
    const cairoOffset = 2 * 60 * 60 * 1000;
    const cairoNow = new Date(now.getTime() + cairoOffset);
    const todayStr = cairoNow.toISOString().split("T")[0];

    // Calculate day index from sequence start
    const startDate = new Date(SEQUENCE_START);
    const todayDate = new Date(todayStr);
    const dayIndex = Math.floor(
      (todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`Day index: ${dayIndex}, Date: ${todayStr}`);

    if (dayIndex < 0 || dayIndex >= prophecies.length) {
      return new Response(
        JSON.stringify({ message: "خارج فترة الصوم الكبير", dayIndex, date: todayStr }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if topic already exists for today
    const dayStart = `${todayStr}T00:00:00.000Z`;
    const dayEnd = `${todayStr}T23:59:59.999Z`;

    const { data: existing } = await supabase
      .from("topics")
      .select("id")
      .gte("scheduled_for", dayStart)
      .lte("scheduled_for", dayEnd)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log("Topic already exists for today:", existing[0].id);
      return new Response(
        JSON.stringify({ message: "نبوة اليوم موجودة مسبقاً", topicId: existing[0].id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prophecy = prophecies[dayIndex];
    console.log(`Generating prophecy #${dayIndex + 1}: ${prophecy.title}`);

    const systemPrompt = `أنت عالم لاهوتي قبطي أرثوذكسي متخصص في نبوات العهد القديم عن المسيح.
مهمتك: إنشاء محتوى يومي عن نبوة مسيانية، بأسلوب تفاسير موقع الأنبا تكلا هيمانوت (الكنيسة القبطية الأرثوذكسية).

عند إعطائك نبوة معينة:
1. اكتب آية أو آيتين من العهد القديم (النبوة) بالنص الكامل بالعربية (ترجمة فاندايك / البيروتية)
2. اكتب آية أو آيتين من العهد الجديد (التحقيق) بالنص الكامل بالعربية
3. اكتب تفسيراً روحياً أرثوذكسياً (3-5 فقرات) يناسب فترة الصوم الكبير:
   - اشرح النبوة وكيف تحققت في شخص المسيح
   - اذكر تعليقات آباء الكنيسة (مثل القديس كيرلس الكبير، القديس أثناسيوس، القديس يوحنا ذهبي الفم) إن أمكن
   - اربط المعنى بالحياة الروحية خلال الصوم الكبير
   - استخدم أسلوب التفسير الروحي والرمزي المعتاد في التقليد القبطي

أجب بصيغة JSON فقط بالشكل التالي:
{
  "title": "عنوان النبوة",
  "description": "وصف مختصر للنبوة وتحقيقها (جملتين)",
  "interpretation": "التفسير الروحي الكامل بأسلوب الأنبا تكلا...",
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

مهم: ضع آيات العهد القديم أولاً ثم آيات العهد الجديد. إجمالي 2-4 آيات.`;

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
            {
              role: "user",
              content: `النبوة رقم ${dayIndex + 1} من نبوات الصوم الكبير:\n${prophecy.title}\n${prophecy.hint}`,
            },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from response
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonContent.trim());

    // Get next order index
    const { data: lastTopic } = await supabase
      .from("topics")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .single();

    const nextOrder = (lastTopic?.order_index || 0) + 1;

    // Insert topic as PUBLISHED (auto-generated)
    const scheduledFor = `${todayStr}T00:00:00.000Z`;
    const { data: newTopic, error: insertError } = await supabase
      .from("topics")
      .insert({
        title: parsed.title || prophecy.title,
        description: parsed.description,
        interpretation: parsed.interpretation,
        is_published: true,
        scheduled_for: scheduledFor,
        order_index: nextOrder,
        points_reward: 10,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save prophecy topic");
    }

    // Insert verses
    if (parsed.verses && Array.isArray(parsed.verses)) {
      const versesToInsert = parsed.verses.map((v: any, i: number) => ({
        topic_id: newTopic.id,
        book: v.book,
        chapter: v.chapter,
        verse_start: v.verse_start,
        verse_end: v.verse_end || null,
        verse_text: v.verse_text,
        order_index: i,
      }));

      const { error: versesError } = await supabase
        .from("verses")
        .insert(versesToInsert);

      if (versesError) {
        console.error("Verses insert error:", versesError);
      }
    }

    console.log(`Prophecy created: ${newTopic.id} - ${parsed.title}`);

    // Send push notification
    try {
      const funcUrl = `${supabaseUrl}/functions/v1/send-push-notification`;
      await fetch(funcUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "✝️ نبوة اليوم",
          body: parsed.title || prophecy.title,
          topicId: newTopic.id,
        }),
      });
      console.log("Push notification sent");
    } catch (notifErr) {
      console.log("Push notification failed (non-critical):", notifErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        topicId: newTopic.id,
        dayIndex: dayIndex + 1,
        prophecy: prophecy.title,
        date: todayStr,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-daily-prophecy:", error);
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
