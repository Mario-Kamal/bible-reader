import { Link } from 'react-router-dom';
import { Bookmark, BookOpen } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useUserProgress } from '@/hooks/useTopics';
import { TopicCard } from '@/components/topics/TopicCard';

export default function Bookmarks() {
  const { data: bookmarks = [], isLoading } = useBookmarks();
  const { data: progress } = useUserProgress();

  const completedTopicIds = new Set(progress?.map((p) => p.topic_id) || []);

  return (
    <AppLayout>
      <div className="min-h-screen" dir="rtl">
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Bookmark className="w-6 h-6" />
              <h1 className="text-2xl font-bold">المفضلة</h1>
            </div>
            <p className="text-primary-foreground/70">{bookmarks.length} موضوع محفوظ</p>
          </div>
        </header>

        <div className="px-4 py-6 max-w-lg mx-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold mb-2">لا توجد مفضلة بعد</h2>
              <p className="text-muted-foreground mb-6">
                افتح أي موضوع واضغط على زر الحفظ لإضافته هنا.
              </p>
              <Button asChild>
                <Link to="/topics">استعراض المواضيع</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((topic, index) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  index={index}
                  isLocked={false}
                  isCompleted={completedTopicIds.has(topic.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
