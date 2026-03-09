import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInWeeks, addWeeks } from 'date-fns';

export interface ReadingPlan {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  total_topics: number;
  is_active: boolean;
  created_at: string;
}

export interface WeeklyGoal {
  id: string;
  plan_id: string;
  week_number: number;
  title: string;
  description: string | null;
  topics_count: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface UserPlanProgress {
  id: string;
  user_id: string;
  plan_id: string;
  enrolled_at: string;
  completed_at: string | null;
  is_active: boolean;
}

// Get active reading plans
export function useReadingPlans() {
  return useQuery({
    queryKey: ['reading-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_plans')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as ReadingPlan[];
    },
  });
}

// Get weekly goals for a plan
export function useWeeklyGoals(planId: string | undefined) {
  return useQuery({
    queryKey: ['weekly-goals', planId],
    queryFn: async () => {
      if (!planId) return [];
      
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('plan_id', planId)
        .order('week_number', { ascending: true });
      
      if (error) throw error;
      return data as WeeklyGoal[];
    },
    enabled: !!planId,
  });
}

// Get user's plan enrollment and progress
export function useUserPlanProgress(planId: string | undefined) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-plan-progress', user?.id, planId],
    queryFn: async () => {
      if (!user || !planId) return null;
      
      const { data, error } = await supabase
        .from('user_plan_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_id', planId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
      return data as UserPlanProgress | null;
    },
    enabled: !!user && !!planId,
  });
}

// Enroll user in a plan
export function useEnrollInPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (planId: string) => {
      if (!user) throw new Error('يجب تسجيل الدخول');
      
      const { error } = await supabase
        .from('user_plan_progress')
        .insert({
          user_id: user.id,
          plan_id: planId,
        });
      
      if (error) throw error;
    },
    onSuccess: (_, planId) => {
      queryClient.invalidateQueries({ queryKey: ['user-plan-progress', user?.id, planId] });
      toast.success('تم الاشتراك في الخطة بنجاح!');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.info('أنت مشترك بالفعل في هذه الخطة');
      } else {
        toast.error('فشل الاشتراك في الخطة');
      }
    },
  });
}

// Calculate weekly progress based on user's completed topics
export function useWeeklyProgress(planId: string | undefined, weeklyGoals: WeeklyGoal[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['weekly-progress', user?.id, planId],
    queryFn: async () => {
      if (!user || !planId || weeklyGoals.length === 0) return {};
      
      // Get all user's completed topics with their dates
      const { data: progressData, error } = await supabase
        .from('user_progress')
        .select('topic_id, completed_at')
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Calculate completed topics per week
      const weeklyCompletion: Record<number, number> = {};
      
      weeklyGoals.forEach(week => {
        const weekStart = parseISO(week.start_date);
        const weekEnd = parseISO(week.end_date);
        
        const completedInWeek = progressData?.filter(p => {
          const completedDate = parseISO(p.completed_at);
          return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
        }).length || 0;
        
        weeklyCompletion[week.week_number] = completedInWeek;
      });
      
      return weeklyCompletion;
    },
    enabled: !!user && !!planId && weeklyGoals.length > 0,
  });
}

// Get current week number based on plan start date
export function getCurrentWeekNumber(planStartDate: string): number {
  const start = parseISO(planStartDate);
  const now = new Date();
  const weeksDiff = differenceInWeeks(now, start);
  return Math.max(1, weeksDiff + 1);
}

// Get overall plan progress percentage
export function calculatePlanProgress(
  weeklyGoals: WeeklyGoal[],
  weeklyCompletion: Record<number, number>
): number {
  if (weeklyGoals.length === 0) return 0;
  
  const totalRequired = weeklyGoals.reduce((sum, w) => sum + w.topics_count, 0);
  const totalCompleted = Object.values(weeklyCompletion).reduce((sum, count) => sum + count, 0);
  
  return Math.min(100, Math.round((totalCompleted / totalRequired) * 100));
}
