import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TestNotificationButton() {
  const [isSending, setIsSending] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const sendTestNotification = async () => {
    setIsSending(true);
    try {
      const { count } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });

      if (!count || count === 0) {
        toast.warning('لا يوجد مشتركين! اذهب للصفحة الرئيسية واضغط "تفعيل إشعارات Push" أولاً');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: '🔔 إشعار تجريبي',
          body: 'هذا إشعار تجريبي للتأكد من عمل الإشعارات بشكل صحيح!',
        }
      });

      if (error) throw error;

      if (data?.sent > 0) {
        toast.success(`تم إرسال الإشعار إلى ${data.sent} مشترك من أصل ${data.total}`);
      } else {
        toast.error(`فشل الإرسال - ${data?.total || 0} مشترك موجود لكن لم يصل لأحد`);
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('فشل في إرسال الإشعار التجريبي');
    } finally {
      setIsSending(false);
    }
  };

  const cleanDuplicates = async () => {
    setIsCleaning(true);
    try {
      // Fetch all subscriptions
      const { data: subs, error: fetchErr } = await supabase
        .from('push_subscriptions')
        .select('id, user_id, endpoint, created_at')
        .order('created_at', { ascending: true });

      if (fetchErr) throw fetchErr;
      if (!subs || subs.length === 0) {
        toast.info('لا يوجد اشتراكات');
        return;
      }

      // Find duplicates: keep the latest per (user_id, endpoint), delete the rest
      const keep = new Map<string, string>(); // composite key -> id to keep
      const toDelete: string[] = [];

      // Sort newest first so the first seen per key is the one we keep
      const sorted = [...subs].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      for (const sub of sorted) {
        const key = `${sub.user_id || 'anon'}::${sub.endpoint}`;
        if (keep.has(key)) {
          toDelete.push(sub.id);
        } else {
          keep.set(key, sub.id);
        }
      }

      if (toDelete.length === 0) {
        toast.info(`لا يوجد اشتراكات مكررة (${subs.length} اشتراك فريد)`);
        return;
      }

      const { error: delErr } = await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', toDelete);

      if (delErr) throw delErr;

      toast.success(`تم حذف ${toDelete.length} اشتراك مكرر، وتبقى ${keep.size} اشتراك`);
    } catch (error) {
      console.error('Clean duplicates error:', error);
      toast.error('فشل في تنظيف الاشتراكات المكررة');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={sendTestNotification}
        disabled={isSending}
        variant="outline"
        className="border-primary/30 hover:bg-primary/10"
      >
        {isSending ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            جاري الإرسال...
          </>
        ) : (
          <>
            <Bell className="w-4 h-4 ml-2" />
            إرسال إشعار تجريبي
          </>
        )}
      </Button>

      <Button
        onClick={cleanDuplicates}
        disabled={isCleaning}
        variant="outline"
        className="border-destructive/30 hover:bg-destructive/10 text-destructive"
      >
        {isCleaning ? (
          <>
            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            جاري التنظيف...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4 ml-2" />
            مسح الاشتراكات المكررة
          </>
        )}
      </Button>
    </div>
  );
}
