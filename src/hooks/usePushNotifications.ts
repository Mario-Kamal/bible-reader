import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const PUSH_SUBSCRIPTION_KEY = 'push-notification-subscribed';

// VAPID public key - in production, this should come from environment
const VAPID_PUBLIC_KEY = 'BPsBdOkkJ1BwPD-MLfcR3p_OY9rXj6Nck2srcBU0lwn4pjGIq1b_3KQa3ZdJURhX569yYwUuNFsFlfAu-CK-ACc';

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

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      
      // Verify actual push subscription exists (not just localStorage flag)
      const checkSubscription = async () => {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = reg ? await reg.pushManager.getSubscription() : null;
          if (sub) {
            setIsSubscribed(true);
            localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'true');
          } else {
            // No active subscription - reset state
            setIsSubscribed(false);
            localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
            localStorage.removeItem('notification-prompt-dismissed');
          }
        } catch {
          setIsSubscribed(false);
          localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
        }
      };
      checkSubscription();
    }
  }, []);

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('Service Worker registered:', registration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      toast.error('الإشعارات غير مدعومة أو يجب تسجيل الدخول أولاً');
      return false;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult !== 'granted') {
        toast.error('تم رفض إذن الإشعارات');
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        toast.error('فشل في تسجيل خدمة الإشعارات');
        return false;
      }

      // Subscribe to push
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource
      });

      console.log('Push subscription:', subscription);

      // Extract keys
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');

      if (!p256dh || !auth) {
        throw new Error('Failed to get subscription keys');
      }

      // Convert to base64
      const p256dhArray = Array.from(new Uint8Array(p256dh));
      const authArray = Array.from(new Uint8Array(auth));
      const p256dhBase64 = btoa(String.fromCharCode.apply(null, p256dhArray));
      const authBase64 = btoa(String.fromCharCode.apply(null, authArray));
      // Save to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: p256dhBase64,
          auth: authBase64
        }, {
          onConflict: 'endpoint'
        });

      if (error) {
        console.error('Error saving subscription:', error);
        throw error;
      }

      setIsSubscribed(true);
      localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'true');
      toast.success('تم تفعيل إشعارات Push بنجاح! 🔔');

      // Show test notification
      new Notification('رحلة الكتاب المقدس 📖', {
        body: 'ستتلقى إشعاراً عند نشر موضوع جديد',
        icon: '/favicon.png',
        tag: 'welcome'
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('فشل في تفعيل الإشعارات');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, user]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }

      setIsSubscribed(false);
      localStorage.setItem(PUSH_SUBSCRIPTION_KEY, 'false');
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
      const { error } = await supabase.functions.invoke('send-push-notification', {
        body: { title, body, topicId }
      });

      if (error) {
        console.error('Error sending notifications:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending notifications:', error);
      return false;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    sendNotificationToAll
  };
}
