import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Gift, Check } from 'lucide-react';
import { toast } from 'sonner';

export function WeeklyChallenge() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: challenge } = useQuery({
    queryKey: ['active-weekly-challenge'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('is_active', true)
        .lte('week_start', today)
        .gte('week_end', today)
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: progress } = useQuery({
    queryKey: ['challenge-progress', challenge?.id],
    enabled: !!challenge && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('user_challenge_progress')
        .select('*')
        .eq('challenge_id', challenge!.id)
        .eq('user_id', user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Count topics completed this week
  const { data: weeklyCount } = useQuery({
    queryKey: ['weekly-topic-count', challenge?.id],
    enabled: !!challenge && !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .gte('completed_at', challenge!.week_start)
        .lte('completed_at', challenge!.week_end + 'T23:59:59');
      return count || 0;
    },
  });

  const claimBonus = useMutation({
    mutationFn: async () => {
      if (!challenge || !user) return;

      // Upsert progress
      const { error } = await supabase
        .from('user_challenge_progress')
        .upsert({
          user_id: user.id,
          challenge_id: challenge.id,
          completed_count: weeklyCount || 0,
          is_completed: true,
          bonus_claimed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,challenge_id' });

      if (error) throw error;

      // Add bonus points to profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_points: (profile?.total_points || 0) + challenge.bonus_points,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-progress'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success(`🎉 مبروك! حصلت على ${challenge?.bonus_points} نقطة إضافية!`);
    },
    onError: () => toast.error('فشل في المطالبة بالمكافأة'),
  });

  if (!challenge) return null;

  const currentCount = weeklyCount || 0;
  const targetCount = challenge.target_count;
  const progressPercent = Math.min(100, Math.round((currentCount / targetCount) * 100));
  const isCompleted = currentCount >= targetCount;
  const bonusClaimed = progress?.bonus_claimed;

  return (
    <Card className="p-4 border-accent/30 bg-accent/5">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-accent" />
        <h3 className="font-semibold text-sm">تحدي الأسبوع</h3>
      </div>

      <p className="text-sm font-medium mb-1">{challenge.title}</p>
      {challenge.description && (
        <p className="text-xs text-muted-foreground mb-3">{challenge.description}</p>
      )}

      <div className="mb-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{currentCount} / {targetCount}</span>
          <span>{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {isCompleted && !bonusClaimed && (
        <Button
          size="sm"
          onClick={() => claimBonus.mutate()}
          disabled={claimBonus.isPending}
          className="w-full mt-2 gap-1"
        >
          <Gift className="w-4 h-4" />
          احصل على {challenge.bonus_points} نقطة مكافأة!
        </Button>
      )}

      {bonusClaimed && (
        <div className="flex items-center justify-center gap-1 text-sm text-green-600 mt-2">
          <Check className="w-4 h-4" />
          تم الحصول على المكافأة!
        </div>
      )}
    </Card>
  );
}
