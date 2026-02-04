import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTopic, useUserProgress, useCompleteTopic } from '@/hooks/useTopics';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AIReader } from '@/components/reader/AIReader';
import { ReadingEvaluator } from '@/components/reader/ReadingEvaluator';
import { ShareButton } from '@/components/share/ShareButton';
import { ShareableTopicCard } from '@/components/share/ShareableTopicCard';
import { ArrowRight, Check, BookOpen, Sparkles, Volume2, Mic, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TopicReader() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { data: topic, isLoading } = useTopic(topicId);
  const { data: progress } = useUserProgress();
  const completeTopic = useCompleteTopic();
  
  const [showCompletion, setShowCompletion] = useState(false);
  const [activeTab, setActiveTab] = useState<'read' | 'listen'>('read');

  const isCompleted = progress?.some(p => p.topic_id === topicId);
  const sortedVerses = topic?.verses?.sort((a, b) => a.order_index - b.order_index) || [];
  
  // Combine all verses text for reading practice
  const fullText = sortedVerses.map(v => v.verse_text).join(' ');

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
        <div className="min-h-screen p-4" dir="rtl">
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
        <div className="min-h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">الموضوع غير موجود</h2>
            <Button onClick={() => navigate('/topics')}>العودة للمواضيع</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Completion celebration modal
  if (showCompletion) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-hero" dir="rtl">
          <div className="text-center animate-scale-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-gold mb-6 pulse-glow">
              <Sparkles className="w-12 h-12 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-primary-foreground mb-2">ممتاز!</h1>
            <p className="text-primary-foreground/80 mb-6">لقد أكملت هذا الموضوع</p>
            <PointsBadge points={topic.points_reward} size="lg" animated className="mb-8" />
            <Button 
              size="lg" 
              onClick={() => navigate('/topics')}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              متابعة الرحلة
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <div className="min-h-screen pb-24" dir="rtl">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center gap-3 p-4 max-w-2xl mx-auto">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold truncate">{topic.title}</h1>
              <p className="text-xs text-muted-foreground">
                {sortedVerses.length} آية
              </p>
            </div>
            <ShareableTopicCard 
              topic={topic}
              trigger={
                <Button variant="ghost" size="icon">
                  <Image className="w-5 h-5" />
                </Button>
              }
            />
            <ShareButton
              title={topic.title}
              text={topic.description || 'موضوع من رحلة الكتاب المقدس'}
              verse={sortedVerses[0]?.verse_text}
            />
            {!isCompleted && (
              <PointsBadge points={topic.points_reward} size="sm" />
            )}
            {isCompleted && (
              <div className="flex items-center gap-1 text-success text-sm font-medium">
                <Check className="w-4 h-4" />
                مكتمل
              </div>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="px-4 py-4 max-w-2xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="read" className="gap-1">
                <BookOpen className="w-4 h-4" />
                قراءة
              </TabsTrigger>
              <TabsTrigger value="listen" className="gap-1">
                <Volume2 className="w-4 h-4" />
                استماع
              </TabsTrigger>
              {/* Practice tab - temporarily disabled
              <TabsTrigger value="practice" className="gap-1">
                <Mic className="w-4 h-4" />
                تدريب
              </TabsTrigger>
              */}
            </TabsList>

            {/* Read Tab */}
            <TabsContent value="read" className="space-y-6 mt-6">
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
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div className="text-sm font-medium text-primary">
                          {verse.book} {verse.chapter}:{verse.verse_start}
                          {verse.verse_end && verse.verse_end !== verse.verse_start && `-${verse.verse_end}`}
                        </div>
                      </div>
                      <AIReader text={verse.verse_text} />
                    </div>
                    <p className="scripture-text pr-11">
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
                    التفسير
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {topic.interpretation}
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Listen Tab */}
            <TabsContent value="listen" className="space-y-6 mt-6">
              <Card className="p-6 text-center">
                <Volume2 className="w-12 h-12 mx-auto text-primary mb-4" />
                <h3 className="font-semibold mb-2">استمع للموضوع</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {topic.audio_url ? 'تسجيل من المعلم' : 'قراءة بالذكاء الاصطناعي'}
                </p>
                
                {topic.audio_url ? (
                  <audio src={topic.audio_url} controls className="w-full" />
                ) : (
                  <div className="space-y-4">
                    <AIReader text={fullText} />
                    <p className="text-xs text-muted-foreground">
                      استمع للموضوع كاملاً
                    </p>
                  </div>
                )}
              </Card>

              {/* Full text for listening */}
              <Card className="p-5">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  النص الكامل
                </h4>
                <div className="space-y-4">
                  {sortedVerses.map((verse, index) => (
                    <div key={verse.id} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary mt-1">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-primary mb-1">
                          {verse.book} {verse.chapter}:{verse.verse_start}
                          {verse.verse_end && verse.verse_end !== verse.verse_start && `-${verse.verse_end}`}
                        </p>
                        <p className="scripture-text text-sm leading-relaxed">
                          {verse.verse_text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Interpretation in listen tab too */}
              {topic.interpretation && (
                <Card className="card-gold p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    التفسير
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {topic.interpretation}
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Practice Tab - temporarily disabled
            <TabsContent value="practice" className="space-y-6 mt-6">
              <Card className="p-6">
                <div className="text-center mb-6">
                  <Mic className="w-12 h-12 mx-auto text-primary mb-4" />
                  <h3 className="font-semibold mb-2">تدرب على القراءة</h3>
                  <p className="text-sm text-muted-foreground">
                    اقرأ النص بصوتك وسيقيّم الذكاء الاصطناعي قراءتك
                  </p>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg mb-6">
                  <p className="text-sm font-medium mb-2">النص المطلوب قراءته:</p>
                  <p className="scripture-text text-sm leading-relaxed">
                    {sortedVerses[0]?.verse_text || fullText.slice(0, 200)}
                  </p>
                </div>

                <ReadingEvaluator 
                  expectedText={sortedVerses[0]?.verse_text || fullText.slice(0, 200)}
                />
              </Card>

              {sortedVerses.length > 1 && (
                <div className="space-y-4">
                  <h4 className="font-semibold">تدرب على كل آية</h4>
                  {sortedVerses.map((verse, index) => (
                    <Card key={verse.id} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {verse.book} {verse.chapter}:{verse.verse_start}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {verse.verse_text}
                      </p>
                      <ReadingEvaluator expectedText={verse.verse_text} />
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            */}
          </Tabs>
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
                  <Check className="w-5 h-5 ml-2" />
                  تمت القراءة
                </>
              ) : completeTopic.isPending ? (
                'جاري الحفظ...'
              ) : (
                <>
                  <Check className="w-5 h-5 ml-2" />
                  لقد قرأت هذا الموضوع
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
