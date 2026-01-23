import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const NOTIFICATION_KEY = 'daily-reading-notifications';

export function useNotifications() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window) {
      setPermission(Notification.permission);
      const saved = localStorage.getItem(NOTIFICATION_KEY);
      setIsEnabled(saved === 'true' && Notification.permission === 'granted');
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('الإشعارات غير مدعومة في هذا المتصفح');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        setIsEnabled(true);
        localStorage.setItem(NOTIFICATION_KEY, 'true');
        toast.success('تم تفعيل الإشعارات اليومية');
        
        // Show a test notification
        new Notification('رحلة الكتاب المقدس 📖', {
          body: 'تم تفعيل الإشعارات! ستتلقى تذكيراً يومياً بالموضوع الجديد.',
          icon: '/favicon.png',
          tag: 'welcome',
        });
        
        return true;
      } else {
        toast.error('تم رفض الإشعارات');
        return false;
      }
    } catch (error) {
      console.error('Notification error:', error);
      toast.error('فشل في تفعيل الإشعارات');
      return false;
    }
  };

  const disableNotifications = () => {
    setIsEnabled(false);
    localStorage.setItem(NOTIFICATION_KEY, 'false');
    toast.success('تم إيقاف الإشعارات');
  };

  const showNotification = (title: string, body: string) => {
    if (isEnabled && permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.png',
        tag: 'daily-topic',
      });
    }
  };

  return {
    isEnabled,
    permission,
    requestPermission,
    disableNotifications,
    showNotification,
  };
}

interface NotificationPromptProps {
  onClose?: () => void;
}

export function NotificationPrompt({ onClose }: NotificationPromptProps) {
  const { isEnabled, permission, requestPermission, disableNotifications } = useNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('notification-prompt-dismissed');
    setDismissed(wasDismissed === 'true');
  }, []);

  if (dismissed || isEnabled || permission === 'denied') {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
    onClose?.();
  };

  const handleEnable = async () => {
    const success = await requestPermission();
    if (success) {
      onClose?.();
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 left-2 w-6 h-6"
        onClick={handleDismiss}
      >
        <X className="w-4 h-4" />
      </Button>
      
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">تفعيل الإشعارات اليومية</h3>
          <p className="text-xs text-muted-foreground mb-3">
            احصل على تذكير يومي بموضوع القراءة الجديد
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEnable} className="gap-1">
              <Bell className="w-3 h-3" />
              تفعيل
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              لاحقاً
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface NotificationToggleProps {
  className?: string;
}

export function NotificationToggle({ className }: NotificationToggleProps) {
  const { isEnabled, permission, requestPermission, disableNotifications } = useNotifications();

  if (!('Notification' in window)) {
    return null;
  }

  const handleToggle = async () => {
    if (isEnabled) {
      disableNotifications();
    } else {
      await requestPermission();
    }
  };

  return (
    <Button
      variant={isEnabled ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      className={className}
      disabled={permission === 'denied'}
    >
      {isEnabled ? (
        <>
          <Bell className="w-4 h-4 ml-2" />
          الإشعارات مفعلة
        </>
      ) : permission === 'denied' ? (
        <>
          <BellOff className="w-4 h-4 ml-2" />
          الإشعارات محظورة
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4 ml-2" />
          تفعيل الإشعارات
        </>
      )}
    </Button>
  );
}