import { Card } from '@/components/ui/card';
import { Users, BarChart3, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminStatsProps {
  totalUsers: number;
  activeUsers: number;
  topicsCount: number;
  onUsersClick: () => void;
  onActiveUsersClick: () => void;
  onTopicsClick: () => void;
}

export function AdminStats({ 
  totalUsers, 
  activeUsers, 
  topicsCount,
  onUsersClick,
  onActiveUsersClick,
  onTopicsClick
}: AdminStatsProps) {
  const stats = [
    {
      icon: Users,
      value: totalUsers,
      label: 'إجمالي المستخدمين',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      onClick: onUsersClick,
    },
    {
      icon: BarChart3,
      value: activeUsers,
      label: 'قراء نشطين',
      color: 'text-success',
      bgColor: 'bg-success/10',
      onClick: onActiveUsersClick,
    },
    {
      icon: BookOpen,
      value: topicsCount,
      label: 'المواضيع',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      onClick: onTopicsClick,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card 
          key={stat.label}
          className={cn(
            "p-4 text-center bg-card/80 backdrop-blur-sm border-border/50",
            "hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          )}
          onClick={stat.onClick}
        >
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2", stat.bgColor)}>
            <stat.icon className={cn("w-5 h-5", stat.color)} />
          </div>
          <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          <div className="text-xs text-muted-foreground">{stat.label}</div>
        </Card>
      ))}
    </div>
  );
}
