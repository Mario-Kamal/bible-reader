import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Topic } from '@/hooks/useTopics';

export function useDailyTopic() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTopic, setGeneratedTopic] = useState<Topic | null>(null);
  const queryClient = useQueryClient();

  const generateTopicForDate = async (date: Date): Promise<Topic | null> => {
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

      if (data.generated && data.topic) {
        // Store the generated topic for review
        setGeneratedTopic(data.topic);
        toast.success('تم توليد الموضوع - راجعه ثم وافق أو عدّل');
      } else if (data.topic && !data.generated) {
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

  const approveTopic = useMutation({
    mutationFn: async (topicId: string) => {
      const { error } = await supabase
        .from('topics')
        .update({ is_published: true })
        .eq('id', topicId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      setGeneratedTopic(null);
      toast.success('تم نشر الموضوع بنجاح!');
    },
    onError: () => {
      toast.error('فشل في نشر الموضوع');
    },
  });

  const clearGeneratedTopic = () => {
    setGeneratedTopic(null);
  };

  return {
    generateTopicForDate,
    isGenerating,
    generatedTopic,
    approveTopic,
    clearGeneratedTopic,
  };
}
