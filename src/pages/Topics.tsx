import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { useDailyTopic } from '@/hooks/useDailyTopic';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { DailyReader } from '@/components/daily/DailyReader';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { BookOpen, Calendar, ChevronLeft, Sparkles

 } from 'lucide-react';
import { startOfDay, isAfter, isSameDay } from 'date-fns';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { cn } from '@/lib/utils';

export default function Topics() {
  const { isAdmin } = useAuth();
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { generateTopicForDate, isGenerating, generatedTopic, approveTopic, clearGeneratedTopic } = useDailyTopic();

  const completedTopicIds = new Set(progress?.map(p => p.topic_id) || []);
  
  const today = startOfDay(new Date());
  
  // Filter published topics
  const publishedTopics = useMemo(() => {
    return topics?.filter(t => {
      if (!t.is_published) return false;
      if (!t.scheduled_for) return true;
      const scheduledDay = startOfDay(new Date(t.scheduled_for));
      return !isAfter(scheduledDay, today);
    }).sort((a, b) => {
      // Sort by scheduled_for date descending (newest first)
      if (!a.scheduled_for) return 1;
      if (!b.scheduled_for) return -1;
      return new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime();
    }) || [];
  }, [topics, today]);

  // Find today's topic
  const todaysTopic = useMemo(() => {
    return publishedTopics.find(t => {
      if (!t.scheduled_for) return false;
      return isSameDay(startOfDay(new Date(t.scheduled_for)), today);
    });
  }, [publishedTopics, today]);

  const isTodaysTopicCompleted = todaysTopic ? completedTopicIds.has(todaysTopic.id) : false;

  const isLoading = topicsLoading || progressLoading;

  return (
    <AppLayout>
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6" />
              <h1 className="text-2xl font-bold">القراءة اليومية</h1>
            </div>
            <p className="text-primary-foreground/70">
              {publishedTopics.length} موضوع • {completedTopicIds.size} مكتمل
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
          {/* Today's Topic Indicator */}
          {!isLoading && todaysTopic && (
            <Link to={`/topic/${todaysTopic.id}`}>
              <Card className={cn(
                "p-4 border-2 transition-all hover:shadow-lg",
                isTodaysTopicCompleted 
                  ? "border-success/50 bg-success/5" 
                  : "border-primary/50 bg-primary/5"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                    isTodaysTopicCompleted ? "bg-success/20" : "bg-primary/20"
                  )}>
                    <Sparkles className={cn(
                      "w-6 h-6",
                      isTodaysTopicCompleted ? "text-success" : "text-primary"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">
                      {isTodaysTopicCompleted ? 'تم إكماله ✓' : 'موضوع اليوم'}
                    </p>
                    <h3 className="font-bold text-foreground truncate">{todaysTopic.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <PointsBadge points={todaysTopic.points_reward} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {todaysTopic.verses?.length || 0} آية
                      </span>
                    </div>
                  </div>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            </Link>
          )}

          {/* Daily Reader */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : publishedTopics.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد مواضيع بعد</h3>
              <p className="text-muted-foreground">
                عُد قريباً لمحتوى جديد!
              </p>
            </div>
          ) : (
            <DailyReader
              topics={publishedTopics}
              completedTopicIds={completedTopicIds}
              isLoading={isLoading}
              onGenerateTopic={generateTopicForDate}
              isGenerating={isGenerating}
              isAdmin={isAdmin}
              generatedTopic={generatedTopic}
              onApproveTopic={(id) => approveTopic.mutate(id)}
              isApproving={approveTopic.isPending}
              onClearGeneratedTopic={clearGeneratedTopic}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
