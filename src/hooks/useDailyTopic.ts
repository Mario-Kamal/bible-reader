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
      const dateStr = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase.functions.invoke('get-daily-topic', {
        body: { date: dateStr }
      });

      if (error) {
        throw error;
      }

      if (data.generated) {
        toast.success('تم توليد موضوع جديد بنجاح!');
      }

      // Refresh topics list
      await queryClient.invalidateQueries({ queryKey: ['topics'] });
      
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