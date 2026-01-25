import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDailyTopic() {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const generateTopicForDate = async (date: Date) => {
    setIsGenerating(true);
    try {
      // Use local date format to avoid timezone issues
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const { data, error } = await supabase.functions.invoke('get-daily-topic', {
        body: { date: dateStr }
      });

      if (error) {
        throw error;
      }

      if (data.generated) {
        toast.success('تم توليد موضوع جديد بنجاح!');
      } else if (data.topic) {
        toast.info('يوجد موضوع لهذا اليوم مسبقاً');
      }

      // Refresh topics list from all queries
      await queryClient.invalidateQueries({ queryKey: ['topics'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      
      return data.topic;
    } catch (error) {
      console.error('Error generating topic:', error);
      toast.error('فشل في توليد الموضوع');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateTopicForDate,
    isGenerating
  };
}