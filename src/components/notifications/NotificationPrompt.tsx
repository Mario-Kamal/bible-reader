import { useState, useEffect } from 'react';
import { Bell, BellOff, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface NotificationPromptProps {
  onClose?: () => void;
}

export function NotificationPrompt({ onClose }: NotificationPromptProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSupported, isSubscribed, isPWAInstalled, permission, isLoading, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    localStorage.removeItem('notification-prompt-dismissed');
    const wasDismissed = sessionStorage.getItem('notification-prompt-dismissed');
    setDismissed(wasDismissed === 'true');
  }, []);

  if (!user || dismissed || isSubscribed) {
    return null;
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const needsInstall = isIOS && !isPWAInstalled;

  // On iOS, show install prompt instead of notification prompt
  if (needsInstall) {
    return (
      <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 left-2 w-6 h-6"
          onClick={() => {
            setDismissed(true);
            sessionStorage.setItem('notification-prompt-dismissed', 'true');
            onClose?.();
          }}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">ثبّت التطبيق للإشعارات</h3>
            <p className="text-xs text-muted-foreground mb-3">
              على iOS، يجب تثبيت التطبيق أولاً للحصول على الإشعارات
              <br />
              اضغط <strong>مشاركة ← إضافة للشاشة الرئيسية</strong>
            </p>
            <Button size="sm" variant="outline" onClick={() => navigate('/install')} className="gap-1">
              <Download className="w-3 h-3" />
              تعليمات التثبيت
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!isSupported) return null;

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('notification-prompt-dismissed', 'true');
    onClose?.();
  };

  const handleEnable = async () => {
    const success = await subscribe();
    if (success) {
      onClose?.();
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-primary/40 bg-gradient-to-br from-primary/15 via-card to-accent/15 p-5 shadow-md">
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-2 h-8 w-8"
        onClick={handleDismiss}
        aria-label="إخفاء تذكير الإشعارات"
      >
        <X className="w-4 h-4" />
      </Button>
      
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          {permission === 'denied' ? <BellOff className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
        </div>
        <div className="flex-1">
          <h3 className="mb-1 text-base font-bold">فعّل إشعارات القراءة اليومية</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            يصلك كل يوم إشعار بنزول الإصحاح الجديد الساعة ١:٠٠ بعد منتصف الليل، وآية اليوم الساعة ١٠:٠٠ صباحاً (بتوقيت القاهرة).
          </p>
          {permission === 'denied' ? (
            <p className="rounded-lg bg-muted p-3 text-sm font-medium text-foreground">
              الإشعارات محظورة من إعدادات المتصفح. افتح إعدادات الموقع بجانب شريط العنوان، واسمح بالإشعارات، ثم أعد تحميل التطبيق.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="default" onClick={handleEnable} disabled={isLoading} className="gap-2 font-semibold">
                <Bell className="h-4 w-4" />
                {isLoading ? 'جاري التفعيل...' : 'تفعيل الإشعارات اليومية'}
              </Button>
              <Button size="default" variant="ghost" onClick={handleDismiss}>
                لاحقاً
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
