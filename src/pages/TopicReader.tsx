import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTopic, useUserProgress, useCompleteTopic } from '@/hooks/useTopics';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Check, BookOpen, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopicReader() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { data: topic, isLoading } = useTopic(topicId);
  const { data: progress } = useUserProgress();
  const completeTopic = useCompleteTopic();
  
  const [showCompletion, setShowCompletion] = useState(false);

  const isCompleted = progress?.some(p => p.topic_id === topicId);
  const sortedVerses = topic?.verses?.sort((a, b) => a.order_index - b.order_index) || [];

  const handleComplete = async () => {
    if (!topic || isCompleted) return;
    
    await completeTopic.mutateAsync({
      topicId: topic.id,
      pointsReward: topic.points_reward,
    });
    
    setShowCompletion(true);
  };

  if (isLoading) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen p-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <Skeleton className="h-48 w-full rounded-xl mb-4" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!topic) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Topic Not Found</h2>
            <Button onClick={() => navigate('/topics')}>Back to Topics</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Completion celebration modal
  if (showCompletion) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-hero">
          <div className="text-center animate-scale-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-gold mb-6 pulse-glow">
              <Sparkles className="w-12 h-12 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary-foreground mb-2">Amazing!</h1>
            <p className="text-primary-foreground/80 mb-6">You completed this topic</p>
            <PointsBadge points={topic.points_reward} size="lg" animated className="mb-8" />
            <Button 
              size="lg" 
              onClick={() => navigate('/topics')}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              Continue Journey
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">{topic.title}</h1>
              <p className="text-xs text-muted-foreground">
                {sortedVerses.length} verses
              </p>
            </div>
            {!isCompleted && (
              <PointsBadge points={topic.points_reward} size="sm" />
            )}
            {isCompleted && (
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <Check className="w-4 h-4" />
                Done
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="px-4 py-6 max-w-2xl mx-auto space-y-6">
          {/* Description */}
          {topic.description && (
            <p className="text-muted-foreground leading-relaxed">
              {topic.description}
            </p>
          )}

          {/* Verses */}
          <div className="space-y-4">
            {sortedVerses.map((verse, index) => (
              <Card 
                key={verse.id} 
                className="p-5 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {verse.book} {verse.chapter}:{verse.verse_start}
                    {verse.verse_end && verse.verse_end !== verse.verse_start && `-${verse.verse_end}`}
                  </div>
                </div>
                <p className="scripture-text pl-11">
                  {verse.verse_text}
                </p>
              </Card>
            ))}
          </div>

          {/* Interpretation */}
          {topic.interpretation && (
            <Card className="card-gold p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Interpretation
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {topic.interpretation}
              </p>
            </Card>
          )}
        </div>

        {/* Complete Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
          <div className="max-w-2xl mx-auto">
            <Button 
              size="lg" 
              className={cn(
                "w-full",
                isCompleted && "bg-success hover:bg-success/90"
              )}
              onClick={handleComplete}
              disabled={isCompleted || completeTopic.isPending}
            >
              {isCompleted ? (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Already Completed
                </>
              ) : completeTopic.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  I Have Read This Topic
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
