import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, BookOpen, Mic, ChevronLeft, ChevronRight } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  description?: string | null;
  is_published: boolean;
  scheduled_for: string | null;
  points_reward: number;
  audio_url: string | null;
  verses?: { id: string }[];
}

interface TopicsListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: Topic[];
}

const ITEMS_PER_PAGE = 10;

export function TopicsListDialog({ open, onOpenChange, topics }: TopicsListDialogProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Sort topics by scheduled_for descending (newest first)
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      if (!a.scheduled_for) return 1;
      if (!b.scheduled_for) return -1;
      return new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime();
    });
  }, [topics]);

  const totalPages = Math.ceil(sortedTopics.length / ITEMS_PER_PAGE);
  
  const paginatedTopics = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedTopics.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTopics, currentPage]);

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(p => Math.min(totalPages, p + 1));
  };

  // Reset page when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setCurrentPage(1);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            جميع المواضيع
            <Badge variant="secondary">{topics.length}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        {topics.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا يوجد مواضيع
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {paginatedTopics.map((topic) => (
                <div 
                  key={topic.id} 
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {topic.title}
                        </h3>
                        {topic.audio_url && (
                          <Mic className="w-3 h-3 text-primary flex-shrink-0" />
                        )}
                      </div>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {topic.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {topic.verses?.length || 0} آية
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {topic.points_reward} نقطة
                        </span>
                        {topic.scheduled_for && (
                          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(topic.scheduled_for), 'd MMM yyyy', { locale: ar })}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={topic.is_published ? "default" : "secondary"}
                      className="flex-shrink-0"
                    >
                      {topic.is_published ? 'منشور' : 'مسودة'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="w-4 h-4 ml-1" />
                  السابق
                </Button>
                <span className="text-sm text-muted-foreground">
                  صفحة {currentPage} من {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  التالي
                  <ChevronLeft className="w-4 h-4 mr-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
