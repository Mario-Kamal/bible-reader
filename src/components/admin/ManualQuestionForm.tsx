import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PenLine } from 'lucide-react';
import { toast } from 'sonner';

interface Topic { id: string; title: string; is_published: boolean; scheduled_for?: string | null }

const empty = { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_answer: 'a', points: 5 };

export function ManualQuestionForm({ topics }: { topics: Topic[] }) {
  const [topicId, setTopicId] = useState('');
  const [q, setQ] = useState(empty);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!topicId || !q.question_text || !q.option_a || !q.option_b) {
      toast.error('اكمل السؤال والخيارين أ و ب على الأقل');
      return;
    }
    setSaving(true);
    try {
      const topic = topics.find(t => t.id === topicId);
      const day = (topic?.scheduled_for || new Date().toISOString()).slice(0, 10);
      const { data: comp } = await supabase
        .from('competitions')
        .select('id')
        .lte('start_date', day)
        .gte('end_date', day)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!comp) throw new Error('لا توجد مسابقة لهذا الأسبوع');
      const { error } = await supabase.from('questions').insert({
        topic_id: topicId,
        competition_id: comp.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c || null,
        option_d: q.option_d || null,
        correct_answer: q.correct_answer,
        points: q.points,
      });
      if (error) throw error;
      toast.success('تم حفظ السؤال ✅');
      setQ(empty);
    } catch (e: any) {
      toast.error(e.message || 'فشل حفظ السؤال');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setQ({ ...q, [k]: k === 'points' ? Number(e.target.value) : e.target.value });

  return (
    <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <PenLine className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">إضافة سؤال يدوي</h3>
      </div>
      <div className="space-y-3">
        <Select value={topicId} onValueChange={setTopicId}>
          <SelectTrigger><SelectValue placeholder="اختر الإصحاح..." /></SelectTrigger>
          <SelectContent>
            {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="نص السؤال" value={q.question_text} onChange={set('question_text')} />
        <Input placeholder="الخيار أ" value={q.option_a} onChange={set('option_a')} />
        <Input placeholder="الخيار ب" value={q.option_b} onChange={set('option_b')} />
        <Input placeholder="الخيار ج (اختياري)" value={q.option_c} onChange={set('option_c')} />
        <Input placeholder="الخيار د (اختياري)" value={q.option_d} onChange={set('option_d')} />
        <div className="flex gap-2">
          <Select value={q.correct_answer} onValueChange={(v) => setQ({ ...q, correct_answer: v })}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="a">الإجابة الصحيحة: أ</SelectItem>
              <SelectItem value="b">الإجابة الصحيحة: ب</SelectItem>
              <SelectItem value="c">الإجابة الصحيحة: ج</SelectItem>
              <SelectItem value="d">الإجابة الصحيحة: د</SelectItem>
            </SelectContent>
          </Select>
          <Input type="number" min={1} className="w-24" value={q.points} onChange={set('points')} />
        </div>
        <Button onClick={save} disabled={saving} className="w-full gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          حفظ السؤال
        </Button>
      </div>
    </Card>
  );
}
