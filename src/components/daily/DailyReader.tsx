import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addDays, subDays, startOfDay, isSameDay, isAfter, isBefore } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, BookOpen, Lock, Check, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { cn } from '@/lib/utils';
import { Topic } from '@/hooks/useTopics';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GeneratedTopicDialog } from './GeneratedTopicDialog';

interface DailyReaderProps {
  topics: Topic[];
  completedTopicIds: Set<string>;
  isLoading: boolean;
  onGenerateTopic?: (date: Date) => Promise<Topic | null>;
  isGenerating?: boolean;
  isAdmin?: boolean;
  generatedTopic?: Topic | null;
  onApproveTopic?: (topicId: string) => void;
  isApproving?: boolean;
  onClearGeneratedTopic?: () => void;
  onEditTopic?: (topicId: string) => void;
}

export function DailyReader({ 
  topics, 
  completedTopicIds, 
  isLoading,
  onGenerateTopic,
  isGenerating,
  isAdmin = false,
  generatedTopic,
  onApproveTopic,
  isApproving,
  onClearGeneratedTopic,
  onEditTopic,
}: DailyReaderProps) {
  const navigate = useNavigate();
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showGeneratedDialog, setShowGeneratedDialog] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Generate last 7 days for the calendar strip
  const dateRange = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      dates.push(subDays(today, i));
    }
    return dates;
  }, []);

  // Get dates that have topics for calendar indicators
  const datesWithTopics = useMemo(() => {
    return topics
      .filter(t => t.scheduled_for)
      .map(t => startOfDay(new Date(t.scheduled_for!)));
  }, [topics]);

  // Get dates with completed topics
  const completedDates = useMemo(() => {
    return topics
      .filter(t => t.scheduled_for && completedTopicIds.has(t.id))
      .map(t => startOfDay(new Date(t.scheduled_for!)));
  }, [topics, completedTopicIds]);

  // Find ALL topics for selected date (could be multiple)
  const topicsForDate = useMemo(() => {
    return topics.filter(t => {
      if (!t.scheduled_for) return false;
      const topicDate = startOfDay(new Date(t.scheduled_for));
      return isSameDay(topicDate, selectedDate);
    });
  }, [topics, selectedDate]);

  const isFutureDate = isAfter(selectedDate, today);

  const handlePrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    if (!isBefore(newDate, subDays(today, 30))) {
      setSelectedDate(newDate);
    }
  };

  const handleNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    if (!isAfter(newDate, today)) {
      setSelectedDate(newDate);
    }
  };

  const handleGenerateClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmGenerate = async () => {
    setShowConfirmDialog(false);
    if (onGenerateTopic) {
      const topic = await onGenerateTopic(selectedDate);
      if (topic) {
        setShowGeneratedDialog(true);
      }
    }
  };

  const handleApprove = () => {
    if (generatedTopic && onApproveTopic) {
      onApproveTopic(generatedTopic.id);
      setShowGeneratedDialog(false);
    }
  };

  const handleEdit = () => {
    if (generatedTopic) {
      setShowGeneratedDialog(false);
      onClearGeneratedTopic?.();
      // Navigate to admin with the topic ID for editing
      if (onEditTopic) {
        onEditTopic(generatedTopic.id);
      } else {
        navigate('/admin');
      }
    }
  };

  const handleCloseGeneratedDialog = (open: boolean) => {
    setShowGeneratedDialog(open);
    if (!open) {
      onClearGeneratedTopic?.();
    }
  };

  return (
    <div className="space-y-4">
      {/* Date Navigation Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevDay}
          disabled={isBefore(subDays(selectedDate, 1), subDays(today, 30))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
        
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="flex flex-col h-auto py-1 px-3 hover:bg-muted">
              <h2 className="text-lg font-bold text-foreground">
                {format(selectedDate, 'EEEE', { locale: ar })}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" />
                {format(selectedDate, 'd MMMM yyyy', { locale: ar })}
              </p>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(startOfDay(date));
                  setCalendarOpen(false);
                }
              }}
              disabled={(date) => isAfter(startOfDay(date), today)}
              defaultMonth={selectedDate}
              locale={ar}
              modifiers={{
                hasTopic: datesWithTopics,
                completed: completedDates,
              }}
              modifiersClassNames={{
                hasTopic: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
                completed: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-success",
              }}
            />
          </PopoverContent>
        </Popover>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextDay}
          disabled={isSameDay(selectedDate, today)}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Date Strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {dateRange.map((date) => {
          const dateTopicExists = topics.some(t => {
            if (!t.scheduled_for) return false;
            return isSameDay(startOfDay(new Date(t.scheduled_for)), date);
          });
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);
          
          return (
            <button
              key={date.toISOString()}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center p-2 rounded-xl min-w-[52px] transition-all",
                isSelected 
                  ? "bg-primary text-primary-foreground shadow-lg" 
                  : "bg-card hover:bg-muted",
                isToday && !isSelected && "ring-2 ring-primary/30"
              )}
            >
              <span className="text-[10px] uppercase font-medium opacity-70">
                {format(date, 'EEE', { locale: ar })}
              </span>
              <span className="text-lg font-bold">
                {format(date, 'd')}
              </span>
              {dateTopicExists && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1",
                  isSelected ? "bg-primary-foreground" : "bg-accent"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Topic Cards for Selected Date */}
      {isLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : isFutureDate ? (
        <Card className="p-6 text-center opacity-60">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg mb-1">موضوع الغد</h3>
          <p className="text-muted-foreground text-sm">
            عُد غداً لقراءة موضوع جديد!
          </p>
        </Card>
      ) : topicsForDate.length > 0 ? (
        <div className="space-y-3">
          {topicsForDate.map((topic) => {
            const isCompleted = completedTopicIds.has(topic.id);
            return (
              <Link key={topic.id} to={`/topic/${topic.id}`}>
                <Card className={cn(
                  "card-gold p-5 transition-all hover:shadow-lg",
                  isCompleted && "bg-success/5 border-success/30"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center",
                      isCompleted 
                        ? "bg-success text-success-foreground" 
                        : "bg-gradient-gold text-accent-foreground"
                    )}>
                      {isCompleted ? (
                        <Check className="w-7 h-7" />
                      ) : (
                        <BookOpen className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg text-foreground">
                          {topic.title}
                        </h3>
                        {isCompleted && (
                          <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                            مكتمل
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {topic.description || 'استكشف هذا الموضوع من منظورات متعددة'}
                      </p>
                      <div className="flex items-center gap-3">
                        <PointsBadge points={topic.points_reward} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {topic.verses?.length || 0} آية
                        </span>
                      </div>
                    </div>
                    <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">لا يوجد موضوع لهذا اليوم</h3>
          <p className="text-muted-foreground text-sm mb-4">
            {isAdmin ? 'يمكنك توليد موضوع تلقائي لهذا اليوم' : 'لم يتم إضافة موضوع لهذا اليوم بعد'}
          </p>
          {isAdmin && onGenerateTopic && (
            <Button
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'جاري التوليد...' : 'توليد موضوع تلقائي'}
            </Button>
          )}
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد توليد موضوع</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              هل تريد توليد موضوع جديد ليوم{' '}
              <span className="font-bold text-foreground">
                {format(selectedDate, 'EEEE d MMMM yyyy', { locale: ar })}
              </span>
              ؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={handleConfirmGenerate}>
              نعم، توليد الموضوع
            </AlertDialogAction>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generated Topic Review Dialog */}
      <GeneratedTopicDialog
        open={showGeneratedDialog}
        onOpenChange={handleCloseGeneratedDialog}
        topic={generatedTopic || null}
        onApprove={handleApprove}
        onEdit={handleEdit}
        isApproving={isApproving}
      />

      {/* Today's Tip - show only if there's uncompleted topic today */}
      {isSameDay(selectedDate, today) && topicsForDate.length > 0 && 
       topicsForDate.some(t => !completedTopicIds.has(t.id)) && (
        <div className="bg-accent/10 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">موضوع اليوم</p>
            <p className="text-xs text-muted-foreground">
              اقرأ واحصل على {topicsForDate[0].points_reward} نقطة!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
