import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationToggleProps {
  className?: string;
}

export function PushNotificationToggle({ className }: PushNotificationToggleProps) {
  const { user } = useAuth();
  const { 
    isSupported, 
    isSubscribed, 
    permission, 
    isLoading, 
    subscribe, 
    unsubscribe 
  } = usePushNotifications();

  if (!isSupported || !user) {
    return null;
  }

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <Button
      variant={isSubscribed ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      className={className}
      disabled={permission === 'denied' || isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 ml-2 animate-spin" />
          جاري...
        </>
      ) : isSubscribed ? (
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
