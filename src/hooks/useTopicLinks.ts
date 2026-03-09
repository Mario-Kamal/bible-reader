import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TopicLink {
  id: string;
  source_topic_id: string;
  target_topic_id: string;
  relationship_type: string;
  description: string | null;
  created_at: string;
}

export function useTopicLinks() {
  return useQuery({
    queryKey: ['topic-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_links' as any)
        .select('*');
      
      if (error) throw error;
      return (data || []) as unknown as TopicLink[];
    },
  });
}

export function useGenerateTopicLinks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (topicId?: string) => {
      const { data, error } = await supabase.functions.invoke('generate-topic-links', {
        body: { topicId },
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['topic-links'] });
      toast.success(`تم توليد ${data?.count || 0} رابط بين النبوات`);
    },
    onError: (error) => {
      toast.error('فشل في توليد الروابط');
      console.error(error);
    },
  });
}
