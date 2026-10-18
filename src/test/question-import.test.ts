import { describe, expect, it } from 'vitest';
import { parseQuestionText, questionIsValid } from '../lib/parseQuestionText';

describe('pasted question import', () => {
  it('keeps completion answers as typed blanks without choices', () => {
    const result = parseQuestionText('أولاً: أسئلة أكمل العبارات الآتية\nاحسبوه كل فرح حين تقعون في .......... متنوعة\nالله يعطي الجميع ..........\n(إجابات أكمل: 1. تجارب / 2. بسخاء)');
    expect(result.questions).toHaveLength(2);
    expect(result.questions[0].option_a).toBe('تجارب');
    expect(result.questions[1].option_a).toBe('بسخاء');
    expect(result.questions.map(q => [q.option_b, q.option_c, q.option_d])).toEqual([['', '', ''], ['', '', '']]);
    expect(result.questions.every(questionIsValid)).toBe(true);
  });
  it('maps Arabic multiple choice answer keys', () => {
    const result = parseQuestionText('ثانياً: أسئلة اختر الإجابة الصحيحة\nامتحان الإيمان ينشئ:\n(أ) غنى مالياً\n(ب) صبراً\n(ج) حكمة بشرية\n(د) قوة جسدية\n(إجابات الاختيارات: ١. ب)');
    expect(result.questions[0].correct_answer).toBe('b');
    expect(result.questions[0].option_b).toBe('صبراً');
    expect(questionIsValid(result.questions[0])).toBe(true);
  });
  it('retains true/false answers and strips explanations from the prompt', () => {
    const result = parseQuestionText('ثالثاً: أسئلة ضع علامة صح أو خطأ\nالله يجرب بالشرور. (خطأ - الله لا يجرب أحداً)\nكل عطية صالحة من فوق. (صح)');
    expect(result.questions.map(q => q.correct_answer)).toEqual(['b', 'a']);
    expect(result.questions[0].question_text).toBe('الله يجرب بالشرور.');
    expect(result.questions[0].option_b).toBe('خطأ');
  });
  it('warns on truncated true/false lines', () => {
    const result = parseQuestionText('الديانة تقتصر على الصلاة. (خطأ - تشمل افتقاد');
    expect(result.questions[0].correct_answer).toBe('b');
    expect(result.warnings).toHaveLength(1);
  });
  it('blocks missing answer keys, empty correct options, duplicate options and invalid points', () => {
    const q = parseQuestionText('أسئلة اختر الإجابة الصحيحة\nالسؤال\n(أ) واحد\n(ب) اثنان').questions[0];
    expect(questionIsValid(q)).toBe(false);
    expect(questionIsValid({ ...q, correct_answer: 'c' })).toBe(false);
    expect(questionIsValid({ ...q, correct_answer: 'a', option_b: 'واحد' })).toBe(false);
    expect(questionIsValid({ ...q, correct_answer: 'a', points: 0 })).toBe(false);
    expect(questionIsValid({ ...q, correct_answer: 'a', points: 1 })).toBe(true);
  });
});