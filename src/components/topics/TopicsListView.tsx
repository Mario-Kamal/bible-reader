import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BookOpen, Check, ChevronLeft, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { cn } from '@/lib/utils';
import type { Topic } from '@/hooks/useTopics';

interface TopicsListViewProps {
  topics: Topic[];
  completedTopicIds: Set<string>;
}

export function TopicsListView({ topics, completedTopicIds }: TopicsListViewProps) {
  return (
    <div className="space-y-3">
      {topics.map((topic) => {
        const isCompleted = completedTopicIds.has(topic.id);

        return (
          <Link key={topic.id} to={`/topic/${topic.id}`}>
            <Card
              className={cn(
                'p-5 transition-all hover:shadow-lg',
                isCompleted && 'bg-success/5 border-success/30'
              )}
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center',
                    isCompleted
                      ? 'bg-success text-success-foreground'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  {isCompleted ? <Check className="w-7 h-7" /> : <BookOpen className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-foreground truncate">{topic.title}</h3>
                    {isCompleted && (
                      <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                        مكتمل
                      </span>
                    )}
                  </div>

                  {topic.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{topic.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <PointsBadge points={topic.points_reward} size="sm" />
                    <span className="text-xs text-muted-foreground">{topic.verses?.length || 0} آية</span>
                    {topic.scheduled_for && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(topic.scheduled_for), 'd MMMM yyyy', { locale: ar })}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
