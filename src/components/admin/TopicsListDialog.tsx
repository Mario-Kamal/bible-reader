import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, BookOpen, Mic } from 'lucide-react';

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

export function TopicsListDialog({ open, onOpenChange, topics }: TopicsListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh]" dir="rtl">
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
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-3">
              {topics.map((topic) => (
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
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
