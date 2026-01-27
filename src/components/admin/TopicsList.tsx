import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Mic, BookOpen, Calendar, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Topic {
  id: string;
  title: string;
  description?: string | null;
  is_published: boolean;
  audio_url: string | null;
  points_reward: number;
  scheduled_for: string | null;
  verses?: { id: string }[];
}

interface TopicsListProps {
  topics: Topic[];
  onEdit: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
  onDelete: (id: string) => void;
}

export function TopicsList({ topics, onEdit, onTogglePublish, onDelete }: TopicsListProps) {
  return (
    <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">المواضيع المحفوظة</h2>
        <Badge variant="secondary" className="text-xs">
          {topics.length}
        </Badge>
      </div>
      
      <div className="space-y-3">
        {topics.map(topic => (
          <Card 
            key={topic.id} 
            className="p-4 hover:shadow-md transition-all group border-border/50"
          >
            {/* Title Row */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-foreground leading-relaxed">
                  {topic.title}
                </h3>
                {topic.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {topic.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => onTogglePublish(topic.id, !topic.is_published)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                  topic.is_published 
                    ? 'bg-success/15 text-success hover:bg-success/25' 
                    : 'bg-warning/15 text-warning hover:bg-warning/25'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${topic.is_published ? 'bg-success' : 'bg-warning'}`} />
                {topic.is_published ? 'منشور' : 'مسودة'}
              </button>
            </div>

            {/* Meta Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {topic.verses?.length || 0} آية
                </span>
                <span>{topic.points_reward} نقطة</span>
                {topic.scheduled_for && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(topic.scheduled_for), 'd MMMM yyyy', { locale: ar })}
                  </span>
                )}
                {topic.audio_url && (
                  <Badge variant="outline" className="text-xs gap-1 py-0">
                    <Mic className="w-3 h-3" />
                    صوتي
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(topic.id)}
                  className="h-8 px-2 opacity-70 group-hover:opacity-100"
                >
                  <Pencil className="w-4 h-4 ml-1" />
                  تعديل
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-70 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف الموضوع</AlertDialogTitle>
                      <AlertDialogDescription>
                        هل أنت متأكد من حذف "{topic.title}"؟ لا يمكن التراجع عن هذا الإجراء.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onDelete(topic.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
        {topics.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">لا توجد مواضيع بعد</p>
            <p className="text-xs text-muted-foreground/70 mt-1">ابدأ بإضافة موضوع جديد</p>
          </div>
        )}
      </div>
    </Card>
  );
}
