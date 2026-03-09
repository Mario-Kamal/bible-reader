import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PUSH_SUBSCRIPTION_KEY = 'push-notification-subscribed';
const VAPID_KEY_CACHE = 'vapid-public-key';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

async function getVapidPublicKey(): Promise<string | null> {
  // Check cache first
  const cached = localStorage.getItem(VAPID_KEY_CACHE);
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error) throw error;
    
    const key = data?.publicKey;
    if (key) {
      localStorage.setItem(VAPID_KEY_CACHE, key);
      return key;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch VAPID key:', err);
    return null;
  }
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    setIsPWAInstalled(isStandalone());

    if (supported) {
      setPermission(Notification.permission);
      
      const checkSubscription = async () => {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = reg ? await reg.pushManager?.getSubscription() : null;
          if (sub) {
            setIsSubscribed(true);
            localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'true');
          } else {
            setIsSubscribed(false);
            localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
            localStorage.removeItem('notification-prompt-dismissed');
          }
        } catch (err) {
          console.error('Error checking subscription:', err);
          setIsSubscribed(false);
          localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
        }
      };
      checkSubscription();
    }
  }, []);

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      let registration = await navigator.serviceWorker.getRegistration('/');
      
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('Service Worker registered:', registration);
      }
      
      if (registration.installing) {
        await new Promise<void>((resolve) => {
          registration!.installing!.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') resolve();
          });
        });
      } else if (registration.waiting) {
        await new Promise<void>((resolve) => {
          registration!.waiting!.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') resolve();
          });
        });
      }
      
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً');
      return false;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isStandalone()) {
      toast.error('على iOS يجب تثبيت التطبيق أولاً (مشاركة ← إضافة للشاشة الرئيسية)', {
        duration: 6000,
      });
      return false;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error('الإشعارات غير مدعومة في هذا المتصفح');
      return false;
    }

    setIsLoading(true);

    try {
      // Get VAPID key from server (ensures it matches)
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        toast.error('فشل في الحصول على مفتاح الإشعارات');
        return false;
      }

      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast.error('تم رفض إذن الإشعارات. يرجى تفعيلها من إعدادات المتصفح');
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        toast.error('فشل في تسجيل خدمة الإشعارات');
        return false;
      }

      // Unsubscribe from old subscription first (in case key changed)
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        await existingSub.unsubscribe();
        console.log('Unsubscribed from old push subscription');
      }

      // Subscribe with the correct server key
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      console.log('Push subscription created:', subscription.endpoint.substring(0, 60));

      // Extract keys
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        throw new Error('Failed to get subscription keys');
      }

      const p256dhBase64 = btoa(String.fromCharCode(...new Uint8Array(p256dh)));
      const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)));

      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: p256dhBase64,
          auth: authBase64,
        }, {
          onConflict: 'endpoint',
        });

      if (error) {
        console.error('Error saving subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'true');
      toast.success('تم تفعيل الإشعارات بنجاح! 🔔');

      try {
        new Notification('رحلة الكتاب المقدس 📖', {
          body: 'ستتلقى إشعاراً عند نشر نبوة جديدة',
          icon: '/favicon.png',
          tag: 'welcome',
        });
      } catch {
        // Local notification might fail, OK
      }

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      // Clear cached key in case it's stale
      localStorage.removeItem(VAPID_KEY_CACHE);
      const msg = error instanceof Error ? error.message : 'خطأ غير معروف';
      toast.error(`فشل في تفعيل الإشعارات: ${msg}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
          
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
      toast.success('تم إيقاف الإشعارات');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('فشل في إيقاف الإشعارات');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const sendNotificationToAll = useCallback(async (title: string, body: string, topicId?: string) => {
    try {
      const response = await supabase.functions.invoke('send-push-notification', {
        body: { title, body, topicId },
      });

      if (response.error) {
        console.error('Error sending notifications:', response.error);
        toast.error('فشل في إرسال الإشعارات');
        return false;
      }

      console.log('Push notification response:', response.data);
      toast.success(`تم إرسال الإشعار (${response.data?.sent || 0}/${response.data?.total || 0})`);
      return true;
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast.error('فشل في إرسال الإشعارات');
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    isPWAInstalled,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    sendNotificationToAll,
  };
}
