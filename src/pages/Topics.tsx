import { useMemo } from 'react';
import { format, startOfDay, isSameDay, subDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { useDailyTopic } from '@/hooks/useDailyTopic';
import { AppLayout } from '@/components/layout/AppLayout';
import { TopicCard } from '@/components/topics/TopicCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { BookOpen, Calendar, Lock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Topics() {
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { generateTopicForDate, isGenerating } = useDailyTopic();

  const completedTopicIds = new Set(progress?.map(p => p.topic_id) || []);
  
  const today = startOfDay(new Date());
  
  // Filter published topics
  const publishedTopics = useMemo(() => {
    return topics?.filter(t => {
      if (!t.is_published) return false;
      if (!t.scheduled_for) return true;
      return new Date(t.scheduled_for) <= new Date();
    }).sort((a, b) => {
      // Sort by scheduled_for date descending (newest first)
      if (!a.scheduled_for) return 1;
      if (!b.scheduled_for) return -1;
      return new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime();
    }) || [];
  }, [topics]);

  // Group topics by date
  const topicsByDate = useMemo(() => {
    const grouped: { date: Date; topic: typeof publishedTopics[0] }[] = [];
    
    publishedTopics.forEach(topic => {
      if (topic.scheduled_for) {
        grouped.push({
          date: startOfDay(new Date(topic.scheduled_for)),
          topic
        });
      }
    });

    return grouped;
  }, [publishedTopics]);

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

        {/* Topics List */}
        <div className="px-4 py-6 max-w-lg mx-auto">
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
            <div className="space-y-4">
              {topicsByDate.map(({ date, topic }, index) => {
                const isCompleted = completedTopicIds.has(topic.id);
                const isToday = isSameDay(date, today);
                const formattedDate = format(date, 'EEEE، d MMMM', { locale: ar });
                
                return (
                  <div key={topic.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    {/* Date Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        isToday 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {isToday ? 'اليوم' : formattedDate}
                      </div>
                      {isCompleted && (
                        <div className="flex items-center gap-1 text-success text-xs">
                          <Check className="w-3 h-3" />
                          <span>تمت القراءة</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Topic Card */}
                    <TopicCard
                      topic={topic}
                      isCompleted={isCompleted}
                      isLocked={false}
                      index={index}
                      showDate={false}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}