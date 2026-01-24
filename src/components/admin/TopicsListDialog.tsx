import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar, BookOpen, Mic } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
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
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">العنوان</TableHead>
                <TableHead className="text-center">الآيات</TableHead>
                <TableHead className="text-center">النقاط</TableHead>
                <TableHead className="text-center">الحالة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow key={topic.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {topic.title}
                      {topic.audio_url && (
                        <Mic className="w-3 h-3 text-primary" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{topic.verses?.length || 0}</TableCell>
                  <TableCell className="text-center">{topic.points_reward}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={topic.is_published ? "default" : "secondary"}>
                      {topic.is_published ? 'منشور' : 'مسودة'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {topic.scheduled_for ? (
                      <div className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(topic.scheduled_for), 'd MMM yyyy', { locale: ar })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">غير محدد</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
