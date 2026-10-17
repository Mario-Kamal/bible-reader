import { describe, expect, it } from 'vitest';
import { parseChapterContent } from '../../supabase/functions/_shared/chapter-content';
import { getChapterPassage } from '../lib/chapterPassage';

function createChapter(verseEnd = 36) {
  return {
    title: 'إنجيل يوحنا - الإصحاح 3',
    description: 'قراءة من الإصحاح الثالث.',
    interpretation: 'شرح الإصحاح.',
    verses: [{
      book: 'يوحنا',
      chapter: 3,
      verse_start: 1,
      verse_end: verseEnd,
      verse_text: 'نص الإصحاح كله متصلاً دون تقسيم الآيات.',
    }],
  };
}

describe('parseChapterContent', () => {
  it('accepts one continuous passage for the complete chapter', () => {
    const parsed = parseChapterContent(JSON.stringify(createChapter()));

    expect(parsed.verses).toHaveLength(1);
    expect(parsed.verses[0]).toMatchObject({
      book: 'يوحنا',
      chapter: 3,
      verse_start: 1,
      verse_end: 36,
    });

    describe('getChapterPassage', () => {
      it('joins legacy verse rows into one continuous passage', () => {
        const passage = getChapterPassage([
          {
            book: 'يوحنا',
            chapter: 3,
            verse_start: 2,
            verse_end: null,
            verse_text: 'الآية الثانية.',
            order_index: 1,
          },
          {
            book: 'يوحنا',
            chapter: 3,
            verse_start: 1,
            verse_end: null,
            verse_text: 'الآية الأولى.',
            order_index: 0,
          },
        ]);

        expect(passage.text).toBe('الآية الأولى. الآية الثانية.');
        expect(passage.reference).toBe('يوحنا 3:1-2');
      });

      it('keeps a stored whole-chapter passage intact', () => {
        const passage = getChapterPassage([
          {
            book: 'يوحنا',
            chapter: 3,
            verse_start: 1,
            verse_end: 36,
            verse_text: 'نص الإصحاح كله في فقرة واحدة.',
          },
        ]);

        expect(passage.text).toBe('نص الإصحاح كله في فقرة واحدة.');
        expect(passage.reference).toBe('إصحاح 3 من يوحنا');
      });
    });
    expect(parsed.verses[0].verse_text).toBe('نص الإصحاح كله متصلاً دون تقسيم الآيات.');
  });

  it('rejects a chapter split into multiple verse records', () => {
    const chapter = createChapter();
    chapter.verses.push({
      book: 'يوحنا',
      chapter: 3,
      verse_start: 2,
      verse_end: 2,
      verse_text: 'آية منفصلة',
    });

    expect(() => parseChapterContent(JSON.stringify(chapter))).toThrow(
      'AI response must contain one continuous chapter passage',
    );
  });

  it('rejects a passage that does not start at the first verse', () => {
    const chapter = createChapter();
    chapter.verses[0].verse_start = 2;

    expect(() => parseChapterContent(JSON.stringify(chapter))).toThrow(
      'AI response must contain the complete chapter as one continuous text',
    );
  });

  it('rejects a passage with an invalid ending verse', () => {
    const chapter = createChapter();
    chapter.verses[0].verse_end = 177;

    expect(() => parseChapterContent(JSON.stringify(chapter))).toThrow(
      'AI response must contain the complete chapter as one continuous text',
    );
  });
});
