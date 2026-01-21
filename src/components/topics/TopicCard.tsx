import { Link } from 'react-router-dom';
import { BookOpen, Check, Lock, ChevronLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { cn } from '@/lib/utils';
import { Topic } from '@/hooks/useTopics';

interface TopicCardProps {
  topic: Topic;
  isCompleted: boolean;
  isLocked: boolean;
  index: number;
}

export function TopicCard({ topic, isCompleted, isLocked, index }: TopicCardProps) {
  const verseCount = topic.verses?.length || 0;

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
            <p className="text-sm text-muted-foreground">أكمل الموضوع السابق للفتح</p>
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
              : "bg-primary/10 text-primary"
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
            <p className="text-sm text-muted-foreground">
              {verseCount} آية من أسفار متعددة
            </p>
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
