import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatristicCommentary {
  id: string;
  topic_id: string;
  saint_name: string;
  saint_title: string | null;
  commentary_text: string;
  source: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export function usePatristicCommentaries(topicId: string | undefined) {
  return useQuery({
    queryKey: ['patristic-commentaries', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      
      const { data, error } = await supabase
        .from('patristic_commentaries')
        .select('*')
        .eq('topic_id', topicId)
        .order('order_index', { ascending: true });
      
      if (error) throw error;
      return data as PatristicCommentary[];
    },
    enabled: !!topicId,
  });
}
