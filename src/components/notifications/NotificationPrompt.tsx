import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationPromptProps {
  onClose?: () => void;
}

export function NotificationPrompt({ onClose }: NotificationPromptProps) {
  const { user } = useAuth();
  const { isSupported, isSubscribed, permission, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('notification-prompt-dismissed');
    setDismissed(wasDismissed === 'true');
  }, []);

  // Don't show if: not supported, no user, already subscribed, dismissed, or denied
  if (!isSupported || !user || dismissed || isSubscribed || permission === 'denied') {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
    onClose?.();
  };

  const handleEnable = async () => {
    const success = await subscribe();
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
          <h3 className="font-semibold text-sm mb-1">تفعيل إشعارات Push</h3>
          <p className="text-xs text-muted-foreground mb-3">
            احصل على إشعار فوري عند نشر موضوع جديد
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEnable} disabled={isLoading} className="gap-1">
              <Bell className="w-3 h-3" />
              {isLoading ? 'جاري التفعيل...' : 'تفعيل'}
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