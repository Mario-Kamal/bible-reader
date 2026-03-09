import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useBookmarkStatus, useToggleBookmark } from '@/hooks/useBookmarks';

export function BookmarkButton({
  topicId,
  className,
}: {
  topicId: string;
  className?: string;
}) {
  const { data: isBookmarked = false, isLoading } = useBookmarkStatus(topicId);
  const toggle = useToggleBookmark();

  const isPending = toggle.isPending || isLoading;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(className)}
      aria-label={isBookmarked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
      onClick={() => toggle.mutate({ topicId, isBookmarked })}
      disabled={isPending}
    >
      <Bookmark
        className={cn(
          'w-5 h-5 transition-colors',
          isBookmarked ? 'text-primary' : 'text-muted-foreground'
        )}
        fill={isBookmarked ? 'currentColor' : 'none'}
      />
    </Button>
  );
}
