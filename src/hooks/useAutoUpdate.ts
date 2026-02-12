import { useEffect } from 'react';
import { useToast } from './use-toast';
import { updateManager } from '@/lib/updateManager';

/**
 * Hook - يستخدم في App للتحكم بالتحديثات التلقائية
 */
export function useAutoUpdate() {
  const { toast } = useToast();

  useEffect(() => {
    // ابدأ مراقبة التحديثات
    updateManager.start(() => {
      // عند توفر تحديث جديد
      toast({
        title: 'تحديث جديد متاح',
        description: 'يتم تحديث التطبيق الآن...',
        duration: 3000,
      });
    });

    return () => {
      updateManager.stop();
    };
  }, [toast]);
}
