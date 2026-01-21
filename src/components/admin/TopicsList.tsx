import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Pencil, Mic, BookOpen } from 'lucide-react';

interface Topic {
  id: string;
  title: string;
  is_published: boolean;
  audio_url: string | null;
  points_reward: number;
  verses?: { id: string }[];
}

interface TopicsListProps {
  topics: Topic[];
  onEdit: (id: string) => void;
  onTogglePublish: (id: string, published: boolean) => void;
}

export function TopicsList({ topics, onEdit, onTogglePublish }: TopicsListProps) {
  return (
    <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="font-semibold text-lg">المواضيع المحفوظة</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {topics.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {topics.map(topic => (
          <div 
            key={topic.id} 
            className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-xl border border-border/30 transition-colors group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium flex items-center gap-2 truncate">
                  {topic.title}
                  {topic.audio_url && (
                    <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <Mic className="w-3 h-3" />
                      صوتي
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {topic.verses?.length || 0} آية • {topic.points_reward} نقطة
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(topic.id)}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${topic.is_published ? 'text-success' : 'text-muted-foreground'}`}>
                  {topic.is_published ? 'منشور' : 'مسودة'}
                </span>
                <Switch 
                  checked={topic.is_published} 
                  onCheckedChange={checked => onTogglePublish(topic.id, checked)} 
                />
              </div>
            </div>
          </div>
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
