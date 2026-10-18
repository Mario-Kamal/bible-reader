export type AnswerLetter = 'a' | 'b' | 'c' | 'd';
export interface ImportedQuestion {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: AnswerLetter | '';
  points: number;
}

const letters: AnswerLetter[] = ['a', 'b', 'c', 'd'];
const arabicLetters = ['أ', 'ب', 'ج', 'د'];
const clean = (text: string) => text.replace(/[\u200B-\u200F\uFEFF]/g, '').trim();
const unnumber = (text: string) => text.replace(/^\s*[\d٠-٩]+[.)\-]\s*/, '').trim();
const digits = (text: string) => text.replace(/[٠-٩]/g, n => String('٠١٢٣٤٥٦٧٨٩'.indexOf(n)));

function answerKey(line: string): string[] {
  return digits(line).split(/[\/／]/).map(part =>
    part.replace(/^.*?\d+\s*[.)\-:]\s*/, '').replace(/\)\s*$/, '').trim());
}

function emptyQuestion(text: string): ImportedQuestion {
  return { question_text: text, option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: '', points: 5 };
}

export function questionIsValid(q: ImportedQuestion): boolean {
  const correct = q.correct_answer ? q[`option_${q.correct_answer}`] : '';
  const options = letters.map(letter => q[`option_${letter}`].trim()).filter(Boolean);
  return Boolean(q.question_text.trim() && q.option_a.trim() && q.option_b.trim() && correct.trim()
    && new Set(options).size === options.length && Number.isInteger(q.points) && q.points > 0);
}

export function parseQuestionText(text: string): { questions: ImportedQuestion[]; warnings: string[] } {
  const questions: ImportedQuestion[] = [];
  const warnings: string[] = [];
  let section: 'complete' | 'choice' | 'boolean' | undefined;
  let group: ImportedQuestion[] = [];
  let current: ImportedQuestion | undefined;

  for (const raw of text.split(/\r?\n/)) {
    const line = clean(raw);
    if (!line) continue;
    if (/إجابات\s*(أكمل|الاختيارات|اختر)/.test(line)) {
      const answers = answerKey(line);
      group.forEach((q, index) => {
        const answer = answers[index];
        if (!answer) return;
        if (section === 'complete') {
          // Use other supplied answers, never invented distractors. Review remains editable.
          const options = [answer, ...answers.filter(a => a !== answer)];
          const distinct = [...new Set(options)].slice(0, 4);
          const position = index % distinct.length;
          const first = distinct.shift();
          if (first) distinct.splice(position, 0, first);
          letters.forEach((letter, i) => { q[`option_${letter}`] = distinct[i] || ''; });
          q.correct_answer = letters[position];
        } else {
          const letterIndex = arabicLetters.indexOf(answer.replace(/إ|ا/g, 'أ'));
          q.correct_answer = letters[letterIndex] || (letters.includes(answer as AnswerLetter) ? answer as AnswerLetter : '');
        }
      });
      continue;
    }
    if (/أسئلة/.test(line) && /أكمل|اختر|صح|خطأ/.test(line)) {
      section = /أكمل/.test(line) ? 'complete' : /اختر/.test(line) ? 'choice' : 'boolean';
      group = [];
      current = undefined;
      continue;
    }
    if (section === 'complete') {
      current = emptyQuestion(`أكمل: ${unnumber(line).replace(/^["“]|["”]$/g, '')}`);
      group.push(current);
      questions.push(current);
    } else if (section === 'choice') {
      const option = line.match(/^\(?([أابجدا-d])\s*[)\.\-:]\s*(.+)$/i);
      if (option && current) {
        const label = option[1].replace('ا', 'أ').toLowerCase();
        const index = arabicLetters.includes(label) ? arabicLetters.indexOf(label) : letters.indexOf(label as AnswerLetter);
        const letter = letters[index];
        if (letter) current[`option_${letter}`] = option[2];
      } else {
        current = emptyQuestion(unnumber(line));
        group.push(current);
        questions.push(current);
      }
    } else {
      const boolean = line.match(/^(.*?)\s*\(\s*(صح|خطأ)(?:\s*[-–:].*?)?\)?\s*$/);
      if (boolean) {
        current = { ...emptyQuestion(unnumber(boolean[1])), option_a: 'صح', option_b: 'خطأ', correct_answer: boolean[2] === 'صح' ? 'a' : 'b' };
        questions.push(current);
        if (!line.endsWith(')')) warnings.push(`السؤال ${questions.length}: النص المنسوخ يبدو مقطوعاً؛ راجعه قبل الحفظ.`);
      } else {
        warnings.push(`لم يتم التعرف على السطر: ${line}`);
      }
    }
  }
  if (!questions.length) warnings.push('لم يتم العثور على أسئلة؛ راجع النص المنسوخ.');
  if (questions.some(q => !questionIsValid(q))) warnings.push('بعض الأسئلة ناقصة أو بلا إجابة صحيحة؛ أكملها في المراجعة.');
  return { questions, warnings };
}