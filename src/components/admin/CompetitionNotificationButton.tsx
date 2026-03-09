import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Bell, Loader2, Swords } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function CompetitionNotificationButton() {
  const [loading, setLoading] = useState<string | null>(null);

  const send = async (type: 'start' | 'mid' | 'end') => {
    setLoading(type);
    try {
      const { data, error } = await supabase.functions.invoke('send-competition-notifications', {
        body: { type },
      });
      if (error) throw error;
      if (data?.sent === 0) {
        toast.info('لا توجد مسابقة نشطة أو مشتركين حالياً');
      } else {
        const labels = { start: 'بداية المسابقة', mid: 'تشجيعي', end: 'قبل الانتهاء' };
        toast.success(`✅ إشعار ${labels[type]} أُرسل لـ ${data?.sent || 0} مشترك`);
      }
    } catch {
      toast.error('فشل في إرسال الإشعار');
    } finally {
      setLoading(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          disabled={!!loading}
          className="gap-2"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Swords className="w-4 h-4" />
          )}
          إشعار مسابقة
          <Bell className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => send('start')}>
          🏁 إشعار بداية المسابقة
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => send('mid')}>
          💪 إشعار تشجيعي
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => send('end')}>
          ⏰ تذكير قبل الانتهاء
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
