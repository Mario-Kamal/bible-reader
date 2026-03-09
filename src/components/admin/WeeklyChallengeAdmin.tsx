import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Target, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function WeeklyChallengeAdmin() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('اقرأ 5 مواضيع هذا الأسبوع');
  const [description, setDescription] = useState('أكمل قراءة 5 مواضيع واحصل على نقاط إضافية!');
  const [targetCount, setTargetCount] = useState(5);
  const [bonusPoints, setBonusPoints] = useState(20);

  const createChallenge = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const { error } = await supabase.from('weekly_challenges').insert({
        title,
        description,
        target_count: targetCount,
        bonus_points: bonusPoints,
        week_start: weekStart.toISOString().split('T')[0],
        week_end: weekEnd.toISOString().split('T')[0],
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-weekly-challenge'] });
      setShowForm(false);
      toast.success('تم إنشاء التحدي الأسبوعي!');
    },
    onError: () => toast.error('فشل في إنشاء التحدي'),
  });

  return (
    <>
      <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            <h3 className="font-semibold text-lg">التحديات الأسبوعية</h3>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
            <Plus className="w-4 h-4" />
            تحدي جديد
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">أنشئ تحديات أسبوعية لتشجيع القراء</p>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>تحدي أسبوعي جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان التحدي</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>الوصف</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>عدد المواضيع المطلوبة</Label>
                <Input type="number" value={targetCount} onChange={e => setTargetCount(Number(e.target.value))} min={1} />
              </div>
              <div>
                <Label>نقاط المكافأة</Label>
                <Input type="number" value={bonusPoints} onChange={e => setBonusPoints(Number(e.target.value))} min={1} />
              </div>
            </div>
            <Button
              onClick={() => createChallenge.mutate()}
              disabled={!title || createChallenge.isPending}
              className="w-full"
            >
              {createChallenge.isPending ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الإنشاء...</>
              ) : (
                'إنشاء التحدي'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
