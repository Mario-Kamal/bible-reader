import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { saveTopicsToCache, getTopicsFromCache, saveTopicToCache, getTopicFromCache, isOffline } from './useOfflineTopics';

export interface Verse {
  id: string;
  topic_id: string;
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  verse_text: string;
  order_index: number;
  created_at: string;
}

export interface Topic {
  id: string;
  title: string;
  description: string | null;
  interpretation: string | null;
  points_reward: number;
  order_index: number;
  is_published: boolean;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  audio_url: string | null;
  verses?: Verse[];
}

export interface UserProgress {
  id: string;
  user_id: string;
  topic_id: string;
  completed_at: string;
  points_earned: number;
}

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: async () => {
      if (isOffline()) {
        const cached = getTopicsFromCache();
        if (cached.length > 0) return cached;
      }

      const { data, error } = await supabase
        .from('topics')
        .select('*, verses(*)')
        .order('order_index', { ascending: true });
      
      if (error) {
        // Fallback to cache on network error
        const cached = getTopicsFromCache();
        if (cached.length > 0) return cached;
        throw error;
      }
      
      // Cache for offline use
      saveTopicsToCache(data as Topic[]);
      return data as Topic[];
    },
  });
}

export function useTopic(topicId: string | undefined) {
  return useQuery({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      if (!topicId) return null;

      if (isOffline()) {
        const cached = getTopicFromCache(topicId);
        if (cached) return cached;
      }
      
      const { data, error } = await supabase
        .from('topics')
        .select('*, verses(*)')
        .eq('id', topicId)
        .single();
      
      if (error) {
        const cached = getTopicFromCache(topicId);
        if (cached) return cached;
        throw error;
      }
      
      // Cache individual topic
      saveTopicToCache(data as Topic);
      return data as Topic;
    },
    enabled: !!topicId,
  });
}

export function useUserProgress() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserProgress[];
    },
    enabled: !!user,
  });
}

export function useCompleteTopic() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ topicId, pointsReward }: { topicId: string; pointsReward: number }) => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          topic_id: topicId,
          points_earned: pointsReward,
        });
      
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      await refreshProfile();
      toast.success('Topic completed! Points earned!');
    },
    onError: (error) => {
      if (error.message.includes('duplicate')) {
        toast.info('You have already completed this topic');
      } else {
        toast.error('Failed to save progress');
      }
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, total_points, topics_completed')
        .order('total_points', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });
}
