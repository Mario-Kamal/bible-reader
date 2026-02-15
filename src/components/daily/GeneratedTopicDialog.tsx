import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Check, Pencil, BookOpen, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GeneratedTopic {
  id: string;
  title: string;
  description: string | null;
  interpretation: string | null;
  scheduled_for: string | null;
  points_reward: number;
  verses?: {
    id: string;
    book: string;
    chapter: number;
    verse_start: number;
    verse_end: number | null;
    verse_text: string;
  }[];
}

interface GeneratedTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: GeneratedTopic | null;
  onApprove: () => void;
  onEdit: () => void;
  isApproving?: boolean;
}

export function GeneratedTopicDialog({
  open,
  onOpenChange,
  topic,
  onApprove,
  onEdit,
  isApproving = false,
}: GeneratedTopicDialogProps) {
  if (!topic) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <DialogTitle>موضوع جديد تم توليده</DialogTitle>
          </div>
          <DialogDescription>
            راجع الموضوع ثم وافق عليه أو عدّله
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4">
            {/* Title & Meta */}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{topic.title}</h2>
              <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground">
                <Badge variant="secondary" className="gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {topic.verses?.length || 0} آية
                </Badge>
                <span>{topic.points_reward} نقطة</span>
                {topic.scheduled_for && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(topic.scheduled_for), 'EEEE d MMMM yyyy', { locale: ar })}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {topic.description && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">الوصف</h4>
                <p className="text-foreground">{topic.description}</p>
              </div>
            )}

            {/* Verses Preview */}
            {topic.verses && topic.verses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">الآيات</h4>
                <div className="space-y-2">
                  {topic.verses.slice(0, 3).map((verse, idx) => (
                    <div key={verse.id || idx} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm leading-relaxed">{verse.verse_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ({verse.book} {verse.chapter}: {verse.verse_start}
                        {verse.verse_end && `-${verse.verse_end}`})
                      </p>
                    </div>
                  ))}
                  {topic.verses.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{topic.verses.length - 3} آيات أخرى
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Interpretation Preview */}
            {topic.interpretation && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1">التفسير</h4>
                <p className="text-sm text-foreground line-clamp-4">{topic.interpretation}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={onApprove}
            disabled={isApproving}
            className="flex-1 gap-2"
          >
            <Check className="w-4 h-4" />
            {isApproving ? 'جاري النشر...' : 'موافقة ونشر'}
          </Button>
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex-1 gap-2"
          >
            <Pencil className="w-4 h-4" />
            تعديل
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
