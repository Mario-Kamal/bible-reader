import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { AppLayout } from '@/components/layout/AppLayout';
import { TopicCard } from '@/components/topics/TopicCard';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';

export default function Topics() {
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: progress, isLoading: progressLoading } = useUserProgress();

  const completedTopicIds = new Set(progress?.map(p => p.topic_id) || []);
  
  // Filter published topics and check if they are scheduled for today or earlier
  const now = new Date();
  const publishedTopics = topics?.filter(t => {
    if (!t.is_published) return false;
    if (!t.scheduled_for) return true; // No schedule means always available
    return new Date(t.scheduled_for) <= now;
  }) || [];
  
  const isLoading = topicsLoading || progressLoading;

  // Determine which topics are locked (all previous must be completed)
  const getTopicStatus = (topic: typeof publishedTopics[0], index: number) => {
    const isCompleted = completedTopicIds.has(topic.id);
    
    // First topic is never locked
    if (index === 0) return { isCompleted, isLocked: false };
    
    // Check if previous topic is completed
    const previousTopic = publishedTopics[index - 1];
    const previousCompleted = completedTopicIds.has(previousTopic.id);
    
    return { 
      isCompleted, 
      isLocked: !isCompleted && !previousCompleted 
    };
  };

  return (
    <AppLayout>
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6" />
              <h1 className="text-2xl font-bold">جميع المواضيع</h1>
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
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
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
            <div className="space-y-3">
              {publishedTopics.map((topic, index) => {
                const { isCompleted, isLocked } = getTopicStatus(topic, index);
                return (
                  <TopicCard
                    key={topic.id}
                    topic={topic}
                    isCompleted={isCompleted}
                    isLocked={isLocked}
                    index={index}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
