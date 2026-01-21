import { Card } from '@/components/ui/card';
import { Users, BarChart3, BookOpen } from 'lucide-react';

interface AdminStatsProps {
  totalUsers: number;
  activeUsers: number;
  topicsCount: number;
}

export function AdminStats({ totalUsers, activeUsers, topicsCount }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="p-4 text-center bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="text-2xl font-bold text-foreground">{totalUsers}</div>
        <div className="text-xs text-muted-foreground">إجمالي المستخدمين</div>
      </Card>
      <Card className="p-4 text-center bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
        <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-2">
          <BarChart3 className="w-5 h-5 text-success" />
        </div>
        <div className="text-2xl font-bold text-foreground">{activeUsers}</div>
        <div className="text-xs text-muted-foreground">قراء نشطين</div>
      </Card>
      <Card className="p-4 text-center bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
        <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-2">
          <BookOpen className="w-5 h-5 text-accent" />
        </div>
        <div className="text-2xl font-bold text-foreground">{topicsCount}</div>
        <div className="text-xs text-muted-foreground">المواضيع</div>
      </Card>
    </div>
  );
}
