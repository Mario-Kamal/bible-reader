import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardPaste, Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { isCompletionQuestion } from '@/lib/completionAnswer';
import { parseQuestionText, questionIsValid, type ImportedQuestion, type AnswerLetter } from '@/lib/parseQuestionText';

interface Topic { id: string; title: string; scheduled_for?: string | null }
const letters: AnswerLetter[] = ['a', 'b', 'c', 'd'];
const labels = ['أ', 'ب', 'ج', 'د'];

export function PastedQuestionForm({ topics }: { topics: Topic[] }) {
  const [text, setText] = useState('');
  const [topicId, setTopicId] = useState('');
  const [questions, setQuestions] = useState<ImportedQuestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const update = (index: number, patch: Partial<ImportedQuestion>) => {
    setQuestions(previous => previous.map((q, i) => i === index ? { ...q, ...patch } : q));
  };

  const save = async () => {
    if (!topicId || !questions.length || questions.some(q => !questionIsValid(q))) return;
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    setSaving(true);
    try {
      const day = topic.scheduled_for
        ? topic.scheduled_for.slice(0, 10)
        : new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' });
      const { data: competition, error: lookupError } = await supabase.from('competitions')
        .select('id').lte('start_date', day).gte('end_date', day)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (lookupError) throw lookupError;
      if (!competition) throw new Error('لا توجد مسابقة تغطي تاريخ هذا الإصحاح');
      const { error } = await supabase.from('questions').insert(questions.map(q => ({
        ...q,
        question_text: q.question_text.trim(),
        option_a: q.option_a.trim(), option_b: q.option_b.trim(),
        option_c: q.option_c.trim() || null, option_d: q.option_d.trim() || null,
        topic_id: topicId, competition_id: competition.id,
      })));
      if (error) throw error;
      toast.success(`تم حفظ ${questions.length} سؤال للمسابقة`);
      setQuestions([]); setText(''); setWarnings([]);
      queryClient.invalidateQueries({ queryKey: ['competition-questions'] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'فشل حفظ الأسئلة؛ حاول مرة أخرى');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4 min-w-0">
      <Select value={topicId} onValueChange={setTopicId} disabled={saving}>
        <SelectTrigger aria-label="إصحاح الأسئلة المنسوخة"><SelectValue placeholder="اختر الإصحاح..." /></SelectTrigger>
        <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent>
      </Select>
      <div className="space-y-2">
        <Label htmlFor="pasted-questions">الأسئلة والإجابات</Label>
        <Textarea id="pasted-questions" dir="rtl" rows={10} value={text} disabled={saving}
          placeholder={'أولاً: أسئلة أكمل العبارات الآتية\n...\n(إجابات أكمل: 1. ... / 2. ...)\nثانياً: أسئلة اختر الإجابة الصحيحة\n...\nثالثاً: أسئلة صح أو خطأ'}
          onChange={event => { setText(event.target.value); setQuestions([]); setWarnings([]); }} />
      </div>
      <Button variant="outline" className="w-full gap-2" disabled={!text.trim() || saving} onClick={() => {
        const result = parseQuestionText(text); setQuestions(result.questions); setWarnings(result.warnings);
      }}><ClipboardPaste className="w-4 h-4" />مراجعة الأسئلة</Button>
      {warnings.length > 0 && <ul className="text-sm text-destructive space-y-1" role="alert">{warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul>}
      {questions.length > 0 && <>
        <h4 className="font-semibold">مراجعة {questions.length} سؤال</h4>
        <div className="max-h-[36rem] overflow-y-auto space-y-5 pe-1">
          {questions.map((q, index) => <div key={index} className="space-y-3 border-b border-border pb-5">
            <div className="flex justify-between items-center gap-2">
              <Label htmlFor={`question-${index}`}>السؤال {index + 1}</Label>
              <Button variant="ghost" size="icon" title="حذف السؤال" aria-label={`حذف السؤال ${index + 1}`} disabled={saving}
                onClick={() => setQuestions(previous => previous.filter((_, i) => i !== index))}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <Textarea id={`question-${index}`} value={q.question_text} disabled={saving} onChange={e => update(index, { question_text: e.target.value })} />
            {isCompletionQuestion(q) ? <div className="space-y-2">
              <Label htmlFor={`completion-${index}`}>الإجابة النموذجية</Label>
              <Input id={`completion-${index}`} value={q.option_a} disabled={saving} onChange={e => update(index, { option_a: e.target.value })} />
            </div> : letters.map((letter, i) => <div key={letter} className="flex items-center gap-2">
              <Label htmlFor={`option-${index}-${letter}`} className="shrink-0">{labels[i]}</Label>
              <Input id={`option-${index}-${letter}`} value={q[`option_${letter}`]} disabled={saving}
                onChange={e => update(index, { [`option_${letter}`]: e.target.value })} />
            </div>)}
            <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
              <div className="space-y-1">
                {!isCompletionQuestion(q) && <>
                <Label>الإجابة الصحيحة</Label>
                <Select value={q.correct_answer} disabled={saving} onValueChange={value => update(index, { correct_answer: value as AnswerLetter })}>
                  <SelectTrigger aria-label={`الإجابة الصحيحة للسؤال ${index + 1}`}><SelectValue placeholder="اختر الإجابة" /></SelectTrigger>
                  <SelectContent>{letters.map((letter, i) => <SelectItem key={letter} value={letter} disabled={!q[`option_${letter}`].trim()}>{labels[i]}</SelectItem>)}</SelectContent>
                </Select>
                </>}
              </div>
              <div className="space-y-1"><Label htmlFor={`points-${index}`}>النقاط</Label><Input id={`points-${index}`} type="number" min={1} step={1} value={q.points} disabled={saving} onChange={e => update(index, { points: Number(e.target.value) })} /></div>
            </div>
            {!questionIsValid(q) && <p className="text-sm text-destructive">راجع الخيارات والإجابة الصحيحة والنقاط.</p>}
          </div>)}
        </div>
        <Button className="w-full gap-2" onClick={save} disabled={saving || !topicId || questions.some(q => !questionIsValid(q))}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'جاري الحفظ...' : `حفظ ${questions.length} سؤال`}
        </Button>
      </>}
    </div>
  );
}