import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Topic } from '@/hooks/useTopics';

type BookmarkTopicRow = {
  id: string;
  topic_id: string;
  created_at: string;
  topics: Topic | null;
};

export function useBookmarks() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [] as Topic[];

      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('id, topic_id, created_at, topics:topics(*, verses(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data || []) as unknown as BookmarkTopicRow[];
      return rows.filter((r) => r.topics).map((r) => r.topics!) as Topic[];
    },
    enabled: !!user,
  });
}

export function useBookmarkStatus(topicId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bookmark-status', user?.id, topicId],
    queryFn: async () => {
      if (!user || !topicId) return false;

      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    enabled: !!user && !!topicId,
  });
}

export function useToggleBookmark() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ topicId, isBookmarked }: { topicId: string; isBookmarked: boolean }) => {
      if (!user) throw new Error('Must be logged in');

      if (isBookmarked) {
        const { error } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('topic_id', topicId);

        if (error) throw error;
        return { next: false };
      }

      // Defensive: avoid duplicates if user clicks quickly
      const { data: existing, error: checkError } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .limit(1);

      if (checkError) throw checkError;
      if ((existing?.length || 0) > 0) return { next: true };

      const { error } = await supabase.from('user_bookmarks').insert({
        user_id: user.id,
        topic_id: topicId,
      });

      if (error) throw error;
      return { next: true };
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      await queryClient.invalidateQueries({ queryKey: ['bookmark-status', user?.id, variables.topicId] });
    },
    onError: () => {
      toast.error('تعذر تحديث المفضلة');
    },
  });
}
