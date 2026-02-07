import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function TestNotificationButton() {
  const [isSending, setIsSending] = useState(false);

  const sendTestNotification = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          title: '🔔 إشعار تجريبي',
          body: 'هذا إشعار تجريبي للتأكد من عمل الإشعارات بشكل صحيح!',
        }
      });

      if (error) throw error;

      if (data?.sent > 0) {
        toast.success(`تم إرسال الإشعار إلى ${data.sent} مشترك من أصل ${data.total}`);
      } else if (data?.total === 0) {
        toast.warning('لا يوجد مشتركين في الإشعارات حالياً');
      } else {
        toast.info('تم إرسال الطلب ولكن لم يصل لأي مشترك');
      }
    } catch (error) {
      console.error('Test notification error:', error);
      toast.error('فشل في إرسال الإشعار التجريبي');
    } finally {
      setIsSending(false);
    }
  };

  return (
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
  );
}
