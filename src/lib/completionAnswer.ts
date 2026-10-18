interface CompletionQuestion {
  question_text: string;
  option_a: string;
  option_b: string | null;
}

export function isCompletionQuestion(q: CompletionQuestion): boolean {
  return /^أكمل\s*:/.test(q.question_text) && !q.option_b?.trim();
}

export function normalizeCompletionAnswer(value: string): string {
  return value.normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي')
    .replace(/[\u200B-\u200F\uFEFF]/g, '')
    .replace(/[.,،؛:!?؟"«»]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function completionAnswerIsCorrect(typed: string, expected: string): boolean {
  const answer = normalizeCompletionAnswer(typed);
  return Boolean(answer && answer === normalizeCompletionAnswer(expected));
}