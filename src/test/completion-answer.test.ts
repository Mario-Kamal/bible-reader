import { describe, expect, it } from 'vitest';
import { completionAnswerIsCorrect, isCompletionQuestion } from '../lib/completionAnswer';

describe('typed completion answers', () => {
  it('accepts the supplied completion answer', () => {
    expect(completionAnswerIsCorrect('تجارب', 'تجارب')).toBe(true);
  });
  it('ignores Arabic vowel marks and surrounding whitespace', () => {
    expect(completionAnswerIsCorrect('  بطيئا  ', 'بطيئاً')).toBe(true);
    expect(completionAnswerIsCorrect('انفسكم', 'أنفسكم')).toBe(true);
  });
  it('rejects incorrect and empty answers', () => {
    expect(completionAnswerIsCorrect('خطية', 'تجارب')).toBe(false);
    expect(completionAnswerIsCorrect(' ', 'تجارب')).toBe(false);
  });
  it('distinguishes blanks from multiple choices', () => {
    expect(isCompletionQuestion({ question_text: 'أكمل: ...', option_a: 'تجارب', option_b: '' })).toBe(true);
    expect(isCompletionQuestion({ question_text: 'أكمل: ...', option_a: 'تجارب', option_b: 'خطية' })).toBe(false);
  });
});