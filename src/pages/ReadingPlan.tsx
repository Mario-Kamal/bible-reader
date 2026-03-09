import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Calendar, 
  CheckCircle2, 
  Target, 
  Trophy, 
  BookOpen,
  ChevronLeft,
  Lock,
  Flame
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useReadingPlans, 
  useWeeklyGoals, 
  useUserPlanProgress, 
  useEnrollInPlan,
  useWeeklyProgress,
  getCurrentWeekNumber,
  calculatePlanProgress
} from "@/hooks/useReadingPlan";
import { format, parseISO, isAfter, isBefore, isWithinInterval } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ReadingPlan() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: plans, isLoading: plansLoading } = useReadingPlans();
  const activePlan = plans?.[0]; // Get the most recent active plan
  
  const { data: weeklyGoals = [], isLoading: goalsLoading } = useWeeklyGoals(activePlan?.id);
  const { data: userProgress, isLoading: progressLoading } = useUserPlanProgress(activePlan?.id);
  const { data: weeklyCompletion = {} } = useWeeklyProgress(activePlan?.id, weeklyGoals);
  const enrollMutation = useEnrollInPlan();
  
  const isLoading = plansLoading || goalsLoading || progressLoading;
  const isEnrolled = !!userProgress;
  const currentWeek = activePlan ? getCurrentWeekNumber(activePlan.start_date) : 1;
  const overallProgress = calculatePlanProgress(weeklyGoals, weeklyCompletion);
  
  const getWeekStatus = (week: { week_number: number; start_date: string; end_date: string; topics_count: number }) => {
    const now = new Date();
    const weekStart = parseISO(week.start_date);
    const weekEnd = parseISO(week.end_date);
    const completed = weeklyCompletion[week.week_number] || 0;
    const isComplete = completed >= week.topics_count;
    const isCurrent = isWithinInterval(now, { start: weekStart, end: weekEnd });
    const isPast = isBefore(weekEnd, now);
    const isFuture = isAfter(weekStart, now);
    
    return { isComplete, isCurrent, isPast, isFuture, completed };
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!activePlan) {
    return (
      <AppLayout>
        <div className="p-4 space-y-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            رجوع
          </Button>
          
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">لا توجد خطة قراءة حالياً</h2>
            <p className="text-muted-foreground">
              سيتم إضافة خطة قراءة جديدة قريباً
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 space-y-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">خطة القراءة</h1>
            <p className="text-sm text-muted-foreground">{activePlan.title}</p>
          </div>
        </div>

        {/* Plan Overview Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{activePlan.title}</CardTitle>
                {activePlan.description && (
                  <CardDescription className="mt-1">{activePlan.description}</CardDescription>
                )}
              </div>
              <Badge variant="secondary" className="bg-primary/20 text-primary">
                {weeklyGoals.length} أسابيع
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(parseISO(activePlan.start_date), 'd MMM', { locale: ar })}</span>
              </div>
              <span className="text-muted-foreground">→</span>
              <span>{format(parseISO(activePlan.end_date), 'd MMM yyyy', { locale: ar })}</span>
            </div>
            
            {isEnrolled ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>التقدم الكلي</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            ) : (
              <Button 
                onClick={() => enrollMutation.mutate(activePlan.id)}
                disabled={enrollMutation.isPending}
                className="w-full"
              >
                <Target className="h-4 w-4 ml-2" />
                اشترك في الخطة
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Stats Row */}
        {isEnrolled && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center p-3">
              <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
              <div className="text-lg font-bold">{profile?.current_streak || 0}</div>
              <div className="text-xs text-muted-foreground">يوم متتالي</div>
            </Card>
            <Card className="text-center p-3">
              <BookOpen className="h-5 w-5 mx-auto text-primary mb-1" />
              <div className="text-lg font-bold">{profile?.topics_completed || 0}</div>
              <div className="text-xs text-muted-foreground">نبوة مكتملة</div>
            </Card>
            <Card className="text-center p-3">
              <Trophy className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
              <div className="text-lg font-bold">{profile?.total_points || 0}</div>
              <div className="text-xs text-muted-foreground">نقطة</div>
            </Card>
          </div>
        )}

        {/* Weekly Goals */}
        <div className="space-y-3">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            الأهداف الأسبوعية
          </h2>
          
          {weeklyGoals.map((week) => {
            const status = getWeekStatus(week);
            
            return (
              <Card 
                key={week.id}
                className={cn(
                  "transition-all",
                  status.isCurrent && "ring-2 ring-primary shadow-lg",
                  status.isComplete && "bg-green-50 dark:bg-green-950/20 border-green-200",
                  status.isFuture && !isEnrolled && "opacity-60"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                        status.isComplete ? "bg-green-500 text-white" :
                        status.isCurrent ? "bg-primary text-primary-foreground" :
                        status.isFuture ? "bg-muted text-muted-foreground" :
                        "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                      )}>
                        {status.isComplete ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : status.isFuture ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          week.week_number
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{week.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(week.start_date), 'd MMM', { locale: ar })} - {format(parseISO(week.end_date), 'd MMM', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    
                    {status.isCurrent && (
                      <Badge className="bg-primary">الأسبوع الحالي</Badge>
                    )}
                    {status.isComplete && (
                      <Badge className="bg-green-500">مكتمل</Badge>
                    )}
                  </div>
                  
                  {week.description && (
                    <p className="text-sm text-muted-foreground mb-3">{week.description}</p>
                  )}
                  
                  {isEnrolled && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>{status.completed} / {week.topics_count} نبوات</span>
                        <span className="text-muted-foreground">
                          {Math.round((status.completed / week.topics_count) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(status.completed / week.topics_count) * 100} 
                        className={cn("h-2", status.isComplete && "[&>div]:bg-green-500")}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Empty State for no goals */}
        {weeklyGoals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>لم يتم إضافة أهداف أسبوعية بعد</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
