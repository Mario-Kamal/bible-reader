import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useActiveCompetition() {
  return useQuery({
    queryKey: ['active-competition'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useCompetitionQuestions(competitionId: string | undefined) {
  return useQuery({
    queryKey: ['competition-questions', competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('competition_id', competitionId!);
      if (error) throw error;
      return data;
    },
  });
}

export function useMyCompetitionAnswers(competitionId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-competition-answers', competitionId, user?.id],
    enabled: !!competitionId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_answers')
        .select('*')
        .eq('competition_id', competitionId!)
        .eq('user_id', user!.id);
      if (error) throw error;
      return data;
    },
  });
}

export function useCompetitionLeaderboard(competitionId: string | undefined) {
  return useQuery({
    queryKey: ['competition-leaderboard', competitionId],
    enabled: !!competitionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_answers')
        .select('user_id, points_earned')
        .eq('competition_id', competitionId!);
      if (error) throw error;

      // Aggregate scores per user
      const scores: Record<string, number> = {};
      data.forEach((a) => {
        scores[a.user_id] = (scores[a.user_id] || 0) + a.points_earned;
      });

      // Get profiles
      const userIds = Object.keys(scores);
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      return (profiles || [])
        .map((p) => ({
          ...p,
          score: scores[p.id] || 0,
        }))
        .sort((a, b) => b.score - a.score);
    },
    refetchInterval: 10000, // refresh every 10s
  });
}

export function useSubmitAnswer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      competitionId,
      questionId,
      selectedAnswer,
      isCorrect,
      points,
    }: {
      competitionId: string;
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
      points: number;
    }) => {
      const { error } = await supabase.from('competition_answers').insert({
        competition_id: competitionId,
        user_id: user!.id,
        question_id: questionId,
        selected_answer: selectedAnswer,
        is_correct: isCorrect,
        points_earned: isCorrect ? points : 0,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['my-competition-answers', vars.competitionId] });
      queryClient.invalidateQueries({ queryKey: ['competition-leaderboard', vars.competitionId] });
    },
  });
}
