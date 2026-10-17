interface PassagePart {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  verse_text: string;
  order_index?: number;
}

export function getChapterPassage(parts: readonly PassagePart[]) {
  const sortedParts = [...parts].sort(
    (a, b) => (a.order_index ?? a.verse_start) - (b.order_index ?? b.verse_start),
  );
  const first = sortedParts[0];
  const isSingleChapter = first && sortedParts.every(
    part => part.book === first.book && part.chapter === first.chapter,
  );
  const last = sortedParts[sortedParts.length - 1];
  const start = first?.verse_start;
  const end = last?.verse_end ?? last?.verse_start;

  return {
    text: sortedParts.map(part => part.verse_text.trim()).filter(Boolean).join(' '),
    reference: isSingleChapter
      ? start === 1
        ? `إصحاح ${first.chapter} من ${first.book}`
        : `${first.book} ${first.chapter}:${start}-${end}`
      : 'النص الكتابي الكامل',
  };
}
