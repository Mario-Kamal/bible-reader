import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BookOpen, Check, Lock, ChevronLeft, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { cn } from '@/lib/utils';
import { Topic } from '@/hooks/useTopics';

interface TopicCardProps {
  topic: Topic;
  isCompleted: boolean;
  isLocked: boolean;
  index: number;
  showDate?: boolean;
}

export function TopicCard({ topic, isCompleted, isLocked, index, showDate = false }: TopicCardProps) {
  const verseCount = topic.verses?.length || 0;
  const scheduledDate = topic.scheduled_for ? new Date(topic.scheduled_for) : null;

  if (isLocked) {
    return (
      <Card className="relative overflow-hidden p-4 opacity-60 cursor-not-allowed animate-fade-in" 
            style={{ animationDelay: `${index * 50}ms` }}>
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground/60 truncate">{topic.title}</h3>
            <p className="text-sm text-muted-foreground">موضوع الغد - عُد لاحقاً</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Link to={`/topic/${topic.id}`}>
      <Card className={cn(
        "card-gold p-4 transition-all hover:shadow-lg hover:-translate-y-0.5 animate-fade-in bg-card",
        isCompleted && "bg-success/5 border-success/30"
      )} style={{ animationDelay: `${index * 50}ms` }}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            isCompleted 
              ? "bg-success text-success-foreground" 
              : "bg-gradient-gold text-accent-foreground"
          )}>
            {isCompleted ? (
              <Check className="w-6 h-6" />
            ) : (
              <BookOpen className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">{topic.title}</h3>
              {isCompleted && (
                <span className="text-xs text-success font-medium">مكتمل</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{verseCount} آية</span>
              {showDate && scheduledDate && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(scheduledDate, 'd MMM', { locale: ar })}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isCompleted && (
              <PointsBadge points={topic.points_reward} size="sm" />
            )}
            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>
      </Card>
    </Link>
  );
}