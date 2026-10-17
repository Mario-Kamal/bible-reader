export interface ChapterVerse {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  verse_text: string;
}

export interface ChapterContent {
  title: string;
  description: string;
  interpretation: string;
  verses: ChapterVerse[];
}

export function buildChapterPrompt(usedChapterReferences: string[]) {
  const usedReferences = usedChapterReferences.length
    ? usedChapterReferences.join("، ")
    : "لا توجد قراءات سابقة";

  return `أنت مُعِدّ قراءات كتابية لمكتبة قبطية أرثوذكسية.
مهمتك إعداد إصحاح كتابي كامل للقراءة اليومية مع شرح أمين وواضح.

القواعد:
- اختر إصحاحاً كاملاً واحداً من الكتاب المقدس، لا موضوعاً ولا مجموعة شواهد.
- اختر إصحاحاً كاملاً واكتب نصه كاملاً دون حذف أو تلخيص.
- استخدم نص ترجمة فاندايك العربية، ولا تخترع نصوصاً أو مراجع. إذا تعذّر تقديم النص الكامل بدقة، ارفض التوليد بدلاً من اختلاقه.
- أخرج نص الإصحاح كله في عنصر واحد متصل، ولا تقسّمه أو ترقّم آياته.
- اجعل verse_start = 1 و verse_end = رقم الآية الأخيرة في الإصحاح.
- لا تكرر أياً من الإصحاحات السابقة: ${usedReferences}
- اكتب وصفاً موجزاً وشرحاً كتابياً أرثوذكسياً يلتزمان بالنص ولا يضيفان موضوعات خارجة عنه.

أجب بـ JSON فقط:
{
  "title": "اسم السفر والإصحاح",
  "description": "مقدمة موجزة للإصحاح",
  "interpretation": "شرح أمين للإصحاح",
  "verses": [
    {
      "book": "اسم السفر",
      "chapter": 1,
      "verse_start": 1,
      "verse_end": 50,
      "verse_text": "نص الإصحاح كاملاً في فقرة متصلة واحدة"
    }
  ]
}

أخرج عنصراً واحداً فقط يحتوي على نص الإصحاح كاملاً.`;
}

export function parseChapterContent(content: string): ChapterContent {
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const parsed: unknown = JSON.parse((jsonMatch?.[1] || content).trim());

  if (!parsed || typeof parsed !== "object") {
    throw new Error("AI response is not a chapter object");
  }

  const candidate = parsed as Record<string, unknown>;
  if (
    typeof candidate.title !== "string" ||
    !candidate.title.trim() ||
    typeof candidate.description !== "string" ||
    typeof candidate.interpretation !== "string" ||
    !candidate.interpretation.trim() ||
    !Array.isArray(candidate.verses)
  ) {
    throw new Error("AI response is missing chapter fields");
  }

  const verses = candidate.verses as unknown[];
  if (verses.length !== 1) {
    throw new Error("AI response must contain one continuous chapter passage");
  }

  const firstVerse = verses[0];
  if (!firstVerse || typeof firstVerse !== "object") {
    throw new Error("AI response contains an invalid verse");
  }

  const reference = firstVerse as Record<string, unknown>;
  const book = reference.book;
  const chapter = reference.chapter;
  if (
    typeof book !== "string" ||
    !book.trim() ||
    typeof chapter !== "number" ||
    !Number.isInteger(chapter) ||
    chapter < 1
  ) {
    throw new Error("AI response contains an invalid chapter reference");
  }

  const passage = verses[0] as Record<string, unknown>;
  if (
    passage.verse_start !== 1 ||
    typeof passage.verse_end !== "number" ||
    !Number.isInteger(passage.verse_end) ||
    passage.verse_end < 1 ||
    passage.verse_end > 176 ||
    typeof passage.verse_text !== "string" ||
    !passage.verse_text.trim()
  ) {
    throw new Error("AI response must contain the complete chapter as one continuous text");
  }

  const validatedVerses: ChapterVerse[] = [{
    book,
    chapter,
    verse_start: 1,
    verse_end: passage.verse_end,
    verse_text: passage.verse_text,
  }];

  return {
    title: `إصحاح ${chapter} من ${book}`,
    description: candidate.description,
    interpretation: candidate.interpretation,
    verses: validatedVerses,
  };
}
