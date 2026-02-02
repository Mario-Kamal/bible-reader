import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyVerse {
  id: string;
  verse_date: string;
  book: string;
  chapter: number;
  verse_number: number;
  verse_text: string;
  created_at: string;
}

export function useDailyVerse() {
  return useQuery({
    queryKey: ['daily-verse'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-daily-verse');

      if (error) {
        console.error('Error fetching daily verse:', error);
        throw error;
      }

      return data.verse as DailyVerse;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
