import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Bible verses collection for random selection
const bibleVerses = [
  { book: "يوحنا", chapter: 3, verse: 16, text: "لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ." },
  { book: "مزامير", chapter: 23, verse: 1, text: "الرَّبُّ رَاعِيَّ فَلاَ يُعْوِزُنِي شَيْءٌ." },
  { book: "فيلبي", chapter: 4, verse: 13, text: "أَسْتَطِيعُ كُلَّ شَيْءٍ فِي الْمَسِيحِ الَّذِي يُقَوِّينِي." },
  { book: "إشعياء", chapter: 41, verse: 10, text: "لاَ تَخَفْ لأَنِّي مَعَكَ. لاَ تَتَلَفَّتْ لأَنِّي إِلهُكَ. قَدْ أَيَّدْتُكَ وَأَعَنْتُكَ وَعَضَدْتُكَ بِيَمِينِ بِرِّي." },
  { book: "متى", chapter: 11, verse: 28, text: "تَعَالَوْا إِلَيَّ يَا جَمِيعَ الْمُتْعَبِينَ وَالثَّقِيلِي الأَحْمَالِ، وَأَنَا أُرِيحُكُمْ." },
  { book: "رومية", chapter: 8, verse: 28, text: "وَنَحْنُ نَعْلَمُ أَنَّ كُلَّ الأَشْيَاءِ تَعْمَلُ مَعًا لِلْخَيْرِ لِلَّذِينَ يُحِبُّونَ اللهَ." },
  { book: "أمثال", chapter: 3, verse: 5, text: "تَوَكَّلْ عَلَى الرَّبِّ بِكُلِّ قَلْبِكَ، وَعَلَى فَهْمِكَ لاَ تَعْتَمِدْ." },
  { book: "مزامير", chapter: 46, verse: 1, text: "اللهُ لَنَا مَلْجَأٌ وَقُوَّةٌ. عَوْنًا فِي الضِّيقَاتِ وُجِدَ شَدِيدًا." },
  { book: "يشوع", chapter: 1, verse: 9, text: "أَمَا أَمَرْتُكَ؟ تَشَدَّدْ وَتَشَجَّعْ! لاَ تَرْهَبْ وَلاَ تَرْتَعِبْ لأَنَّ الرَّبَّ إِلهَكَ مَعَكَ حَيْثُمَا تَذْهَبُ." },
  { book: "مزامير", chapter: 27, verse: 1, text: "الرَّبُّ نُورِي وَخَلاَصِي، مِمَّنْ أَخَافُ؟ الرَّبُّ حِصْنُ حَيَاتِي، مِمَّنْ أَرْتَعِبُ؟" },
  { book: "إرميا", chapter: 29, verse: 11, text: "لأَنِّي عَرَفْتُ الأَفْكَارَ الَّتِي أَنَا مُفْتَكِرٌ بِهَا عَنْكُمْ، يَقُولُ الرَّبُّ، أَفْكَارَ سَلاَمٍ لاَ شَرٍّ، لأُعْطِيَكُمْ آخِرَةً وَرَجَاءً." },
  { book: "كورنثوس الثانية", chapter: 12, verse: 9, text: "فَقَالَ لِي: تَكْفِيكَ نِعْمَتِي، لأَنَّ قُوَّتِي فِي الضَّعْفِ تُكْمَلُ." },
  { book: "مزامير", chapter: 91, verse: 1, text: "اَلسَّاكِنُ فِي سِتْرِ الْعَلِيِّ، فِي ظِلِّ الْقَدِيرِ يَبِيتُ." },
  { book: "غلاطية", chapter: 5, verse: 22, text: "وَأَمَّا ثَمَرُ الرُّوحِ فَهُوَ: مَحَبَّةٌ، فَرَحٌ، سَلاَمٌ، طُولُ أَنَاةٍ، لُطْفٌ، صَلاَحٌ، إِيمَانٌ." },
  { book: "بطرس الأولى", chapter: 5, verse: 7, text: "مُلْقِينَ كُلَّ هَمِّكُمْ عَلَيْهِ، لأَنَّهُ هُوَ يَعْتَنِي بِكُمْ." },
  { book: "يوحنا", chapter: 14, verse: 27, text: "سَلاَمًا أَتْرُكُ لَكُمْ. سَلاَمِي أُعْطِيكُمْ. لَيْسَ كَمَا يُعْطِي الْعَالَمُ أُعْطِيكُمْ أَنَا. لاَ تَضْطَرِبْ قُلُوبُكُمْ وَلاَ تَرْهَبْ." },
  { book: "مزامير", chapter: 119, verse: 105, text: "سِرَاجٌ لِرِجْلِي كَلاَمُكَ وَنُورٌ لِسَبِيلِي." },
  { book: "عبرانيين", chapter: 11, verse: 1, text: "وَأَمَّا الإِيمَانُ فَهُوَ الثِّقَةُ بِمَا يُرْجَى وَالإِيقَانُ بِأُمُورٍ لاَ تُرَى." },
  { book: "مزامير", chapter: 34, verse: 8, text: "ذُوقُوا وَانْظُرُوا مَا أَطْيَبَ الرَّبَّ! طُوبَى لِلرَّجُلِ الْمُتَوَكِّلِ عَلَيْهِ." },
  { book: "كولوسي", chapter: 3, verse: 23, text: "وَكُلُّ مَا فَعَلْتُمْ، فَاعْمَلُوا مِنَ الْقَلْبِ، كَمَا لِلرَّبِّ لَيْسَ لِلنَّاسِ." },
  { book: "رومية", chapter: 12, verse: 2, text: "وَلاَ تُشَاكِلُوا هذَا الدَّهْرَ، بَلْ تَغَيَّرُوا عَنْ شَكْلِكُمْ بِتَجْدِيدِ أَذْهَانِكُمْ." },
  { book: "تسالونيكي الأولى", chapter: 5, verse: 16, text: "اِفْرَحُوا كُلَّ حِينٍ. صَلُّوا بِلاَ انْقِطَاعٍ. اشْكُرُوا فِي كُلِّ شَيْءٍ." },
  { book: "أفسس", chapter: 2, verse: 8, text: "لأَنَّكُمْ بِالنِّعْمَةِ مُخَلَّصُونَ، بِالإِيمَانِ، وَذلِكَ لَيْسَ مِنْكُمْ. هُوَ عَطِيَّةُ اللهِ." },
  { book: "مزامير", chapter: 37, verse: 4, text: "وَتَلَذَّذْ بِالرَّبِّ فَيُعْطِيَكَ سُؤْلَ قَلْبِكَ." },
  { book: "يوحنا الأولى", chapter: 4, verse: 19, text: "نَحْنُ نُحِبُّهُ لأَنَّهُ هُوَ أَحَبَّنَا أَوَّلًا." },
  { book: "مزامير", chapter: 103, verse: 1, text: "بَارِكِي يَا نَفْسِي الرَّبَّ، وَكُلُّ مَا فِي بَاطِنِي لِيُبَارِكِ اسْمَهُ الْقُدُّوسَ." },
  { book: "متى", chapter: 6, verse: 33, text: "لكِنِ اطْلُبُوا أَوَّلًا مَلَكُوتَ اللهِ وَبِرَّهُ، وَهذِهِ كُلُّهَا تُزَادُ لَكُمْ." },
  { book: "مزامير", chapter: 121, verse: 1, text: "أَرْفَعُ عَيْنَيَّ إِلَى الْجِبَالِ، مِنْ حَيْثُ يَأْتِي عَوْنِي." },
  { book: "تيموثاوس الثانية", chapter: 1, verse: 7, text: "لأَنَّ اللهَ لَمْ يُعْطِنَا رُوحَ الْفَشَلِ، بَلْ رُوحَ الْقُوَّةِ وَالْمَحَبَّةِ وَالنُّصْحِ." },
  { book: "مزامير", chapter: 139, verse: 14, text: "أَحْمَدُكَ مِنْ أَجْلِ أَنِّي قَدِ امْتَزْتُ عَجَبًا. عَجِيبَةٌ هِيَ أَعْمَالُكَ، وَنَفْسِي تَعْرِفُ ذلِكَ يَقِينًا." },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's date in local format
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];

    // Check if we already have a verse for today
    const { data: existingVerse, error: fetchError } = await supabase
      .from("daily_verses")
      .select("*")
      .eq("verse_date", dateStr)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingVerse) {
      return new Response(JSON.stringify({ verse: existingVerse }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate a verse for today using date-based selection for consistency
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const verseIndex = dayOfYear % bibleVerses.length;
    const selectedVerse = bibleVerses[verseIndex];

    // Insert the new verse
    const { data: newVerse, error: insertError } = await supabase
      .from("daily_verses")
      .insert({
        verse_date: dateStr,
        book: selectedVerse.book,
        chapter: selectedVerse.chapter,
        verse_number: selectedVerse.verse,
        verse_text: selectedVerse.text,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(JSON.stringify({ verse: newVerse, generated: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
