import { useMemo } from 'react';
import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { useDailyTopic } from '@/hooks/useDailyTopic';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { DailyReader } from '@/components/daily/DailyReader';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Calendar } from 'lucide-react';

export default function Topics() {
  const { isAdmin } = useAuth();
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: progress, isLoading: progressLoading } = useUserProgress();
  const { generateTopicForDate, isGenerating } = useDailyTopic();

  const completedTopicIds = new Set(progress?.map(p => p.topic_id) || []);
  
  // Filter published topics
  const publishedTopics = useMemo(() => {
    const now = new Date();
    return topics?.filter(t => {
      if (!t.is_published) return false;
      if (!t.scheduled_for) return true;
      return new Date(t.scheduled_for) <= now;
    }).sort((a, b) => {
      // Sort by scheduled_for date descending (newest first)
      if (!a.scheduled_for) return 1;
      if (!b.scheduled_for) return -1;
      return new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime();
    }) || [];
  }, [topics]);

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

        {/* Topics List - Using DailyReader like Home page */}
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
            <DailyReader
              topics={publishedTopics}
              completedTopicIds={completedTopicIds}
              isLoading={isLoading}
              onGenerateTopic={generateTopicForDate}
              isGenerating={isGenerating}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
