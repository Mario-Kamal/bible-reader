import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Swords } from 'lucide-react';
import { toast } from 'sonner';

interface Topic {
  id: string;
  title: string;
  is_published: boolean;
}

interface AICompetitionGeneratorProps {
  topics: Topic[];
}

export function AICompetitionGenerator({ topics }: AICompetitionGeneratorProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [mode, setMode] = useState<'specific' | 'today'>('today');

  const generateCompetition = useMutation({
    mutationFn: async () => {
      const body = mode === 'specific' && selectedTopicId
        ? { topicId: selectedTopicId }
        : {};

      const { data, error } = await supabase.functions.invoke('generate-competition', {
        body,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      if (data?.message) {
        toast.info(data.message);
      } else {
        toast.success(`تم إنشاء ${data?.questionsCount || 3} أسئلة للمسابقة! 🎉`);
      }
    },
    onError: (error: any) => {
      console.error('Competition generation error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error('تم تجاوز الحد المسموح، حاول بعد قليل');
      } else if (error.message?.includes('Payment')) {
        toast.error('الرصيد غير كافي');
      } else {
        toast.error('فشل في إنشاء المسابقة');
      }
    },
  });

  const publishedTopics = topics.filter(t => t.is_published);

  return (
    <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">إنشاء مسابقة بالذكاء الاصطناعي</h3>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={mode === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('today')}
          >
            موضوع اليوم
          </Button>
          <Button
            variant={mode === 'specific' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('specific')}
          >
            اختر موضوع
          </Button>
        </div>

        {mode === 'specific' && (
          <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
            <SelectTrigger>
              <SelectValue placeholder="اختر موضوع..." />
            </SelectTrigger>
            <SelectContent>
              {publishedTopics.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          onClick={() => generateCompetition.mutate()}
          disabled={generateCompetition.isPending || (mode === 'specific' && !selectedTopicId)}
          className="w-full gap-2"
        >
          {generateCompetition.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              إنشاء أسئلة المسابقة
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          سيتم إنشاء 3 أسئلة اختيار من متعدد عن الموضوع المحدد
        </p>
      </div>
    </Card>
  );
}
