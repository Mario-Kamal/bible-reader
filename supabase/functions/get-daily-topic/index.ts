import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Messianic prophecy topics for manual admin generation
// Messianic prophecy topics for manual admin generation
// Consolidated from generate-daily-prophecy for better variety
const prophecyTopics = [
  "المسيح نسل المرأة - تكوين 3:15",
  "المسيح من نسل إبراهيم - تكوين 22:18",
  "تتبارك فيه جميع الأمم - تكوين 12:3",
  "المسيح من نسل إسحق - تكوين 21:12",
  "المسيح من نسل يعقوب - عدد 24:17",
  "المسيح من سبط يهوذا - تكوين 49:10",
  "نبوة شيلون - لن يزول القضيب - تكوين 49:10",
  "المسيح أسد سبط يهوذا - تكوين 49:9",
  "المسيح من نسل داود - إرميا 23:5",
  "المسيح وارث عرش داود - إشعياء 9:7",
  "غصن من جذع يسّى - إشعياء 11:1",
  "نبوة بلعام عن الكوكب - عدد 24:17",
  "ميلاد المسيح من عذراء - إشعياء 7:14",
  "عمانوئيل - الله معنا - إشعياء 7:14",
  "مولد المسيح في بيت لحم - ميخا 5:2",
  "رحلة الطفل يسوع إلى مصر - هوشع 11:1",
  "مذبحة أطفال بيت لحم - إرميا 31:15",
  "نبوة دانيال عن السبعين أسبوعاً - دانيال 9:24-26",
  "المُرسَل قبل المسيح - يوحنا المعمدان - ملاخي 3:1",
  "صوت صارخ في البرية - إشعياء 40:3",
  "المسيح نبي مثل موسى - تثنية 18:15",
  "المسيح كاهن على رتبة ملكي صادق - مزمور 110:4",
  "بدء خدمة المسيح في الجليل - إشعياء 9:1-2",
  "المسيح نور الأمم - إشعياء 60:3",
  "المسيح نور العالم - إشعياء 9:2",
  "المسيح يُعلّم بأمثال - مزمور 78:2",
  "المسيح يشفي الأمراض - إشعياء 53:4",
  "المسيح يصنع معجزات - إشعياء 35:5-6",
  "المسيح يحمل أحزاننا - إشعياء 53:3",
  "المسيح الراعي الصالح - حزقيال 34:23",
  "المسيح خبز الحياة - خروج 16:4",
  "المسيح الكرمة الحقيقية - إشعياء 5:1-7",
  "شمس البر والشفاء في أجنحتها - ملاخي 4:2",
  "المسيح يدخل الهيكل - ملاخي 3:1",
  "دخول المسيح أورشليم على حمار - زكريا 9:9",
  "حجر الزاوية المرفوض - مزمور 118:22-23",
  "المسيح الملك العادل - إرميا 23:5",
  "خيانة يهوذا الصديق - مزمور 41:9",
  "ثمن الخيانة ثلاثون من الفضة - زكريا 11:12",
  "الفضة تُلقى في بيت الرب - زكريا 11:13",
  "عبد الرب المتألم - إشعياء 52:13-53:12",
  "المسيح حمل الله - إشعياء 53:7",
  "صمت المسيح أمام المتّهمين - إشعياء 53:7",
  "المسيح يُجلد ويُضرب - إشعياء 50:6",
  "المسيح يُبصق عليه ويُهان - إشعياء 50:6",
  "ثقبوا يديّ ورجليّ - مزمور 22:16",
  "المسيح يُصلب مع أثمة - إشعياء 53:12",
  "المسيح يُستهزأ به على الصليب - مزمور 22:7-8",
  "المسيح يُعطى خلاً ومرارة - مزمور 69:21",
  "المسيح يصلّي لأجل صالبيه - إشعياء 53:12",
  "اقتسام ثيابه وإلقاء القرعة - مزمور 22:18",
  "عظم لا يُكسر منه - مزمور 34:20",
  "طعن جنبه بالحربة - زكريا 12:10",
  "ظلمة على الأرض عند الصلب - عاموس 8:9",
  "يُدفن في قبر غني - إشعياء 53:9",
  "العهد الجديد بالدم - إرميا 31:31",
  "قيامة المسيح من الأموات - مزمور 16:10",
  "صعود المسيح إلى السماء - مزمور 68:18",
  "المسيح يجلس عن يمين الآب - مزمور 110:1",
  "إرسال الروح القدس - يوئيل 2:28",
  "ابن الإنسان الآتي على سحاب السماء - دانيال 7:13-14",
  "الحجر المقطوع بدون يدين - دانيال 2:34-35",
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

    // Fetch existing topics to avoid duplicates
    const { data: pastTopics } = await supabase
      .from("topics")
      .select("title")
      .limit(200);
    
    const pastTitles = pastTopics?.map(t => t.title) || [];

    // Fetch used verses to avoid repetition
    const { data: pastVerses } = await supabase
      .from("verses")
      .select("book, chapter, verse_start")
      .limit(500);
    
    const usedVerseRefs = pastVerses?.map(v => `${v.book} ${v.chapter}:${v.verse_start}`).join(", ") || "لا يوجد";

    // Filter prophecyTopics to find one not already used
    const availableTopics = prophecyTopics.filter(p => !pastTitles.some(pt => pt.includes(p.split(" - ")[0]) || p.includes(pt)));
    
    let selectedTopic;
    if (availableTopics.length > 0) {
      // Pick first available
      selectedTopic = availableTopics[0];
    } else {
      // Fallback to random if all used
      const randomIndex = Math.floor(Math.random() * prophecyTopics.length);
      selectedTopic = prophecyTopics[randomIndex];
    }

    const systemPrompt = `أنت عالم لاهوتي قبطي أرثوذكسي متخصص في نبوات العهد القديم عن المسيح.
مهمتك: إنشاء محتوى يومي عن نبوة مسيانية، بأسلوب تفاسير موقع الأنبا تكلا هيمانوت.

عند إعطائك نبوة معينة:
1. اكتب آية أو آيتين من العهد القديم (النبوة) بالنص الكامل (ترجمة فاندايك)
2. اكتب آية أو آيتين من العهد الجديد (التحقيق) بالنص الكامل
3. اكتب تفسيراً روحياً أرثوذكسياً يناسب الصوم الكبير (3-5 فقرات)

**هام جداً لمنع التكرار**:
الآيات المذكورة أدناه تم استخدامها سابقاً في أيام أخرى، **يجب عليك اختيار آيات مختلفة تماماً** (شواهد مختلفة) حتى لو كانت لنفس الموضوع، أو اختيار جانب مختلف من النبوة:
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
            { role: "user", content: `أريد نبوة جديدة ومختلفة عن: ${selectedTopic}. تأكد من عدم تكرار الشواهد الكتابية التي استخدمت سابقاً.` },
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
