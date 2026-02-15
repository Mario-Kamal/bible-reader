import { useDailyVerse } from '@/hooks/useDailyVerse';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen } from 'lucide-react';
import { ShareableVerseCard } from '@/components/share/ShareableVerseCard';

export function DailyVerse() {
  const { data: verse, isLoading, error } = useDailyVerse();

  if (isLoading) {
    return (
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-16 w-full mb-2" />
        <Skeleton className="h-3 w-32" />
      </Card>
    );
  }

  if (error || !verse) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-primary">آية اليوم</h3>
        </div>
        <ShareableVerseCard verse={verse} />
      </div>
      
      <p className="text-foreground leading-relaxed mb-3 text-lg font-serif">
        "{verse.verse_text}"
      </p>
      
      <p className="text-sm text-muted-foreground font-medium">
        ({verse.book} {verse.chapter}: {verse.verse_number})
      </p>
    </Card>
  );
}
