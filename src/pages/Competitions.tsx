import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { useAuth } from '@/contexts/AuthContext';
import {
  useActiveCompetition,
  useCompetitionQuestions,
  useMyCompetitionAnswers,
  useCompetitionLeaderboard,
  useSubmitAnswer,
} from '@/hooks/useCompetitions';
import { Swords, Trophy, CheckCircle2, XCircle, Clock, Crown, Medal, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function Competitions() {
  const { user } = useAuth();
  const { data: competition, isLoading: loadingComp } = useActiveCompetition();
  const { data: questions, isLoading: loadingQ } = useCompetitionQuestions(competition?.id);
  const { data: myAnswers } = useMyCompetitionAnswers(competition?.id);
  const { data: leaderboard } = useCompetitionLeaderboard(competition?.id);
  const submitAnswer = useSubmitAnswer();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const answeredIds = new Set(myAnswers?.map((a) => a.question_id) || []);
  const unanswered = questions?.filter((q) => !answeredIds.has(q.id)) || [];
  const currentQuestion = unanswered[currentIndex];

  const totalScore = myAnswers?.reduce((s, a) => s + a.points_earned, 0) || 0;
  const correctCount = myAnswers?.filter((a) => a.is_correct).length || 0;

  const handleAnswer = async (option: string) => {
    if (!currentQuestion || !competition || showResult) return;
    setSelectedOption(option);
    setShowResult(true);

    const isCorrect = option === currentQuestion.correct_answer;

    try {
      await submitAnswer.mutateAsync({
        competitionId: competition.id,
        questionId: currentQuestion.id,
        selectedAnswer: option,
        isCorrect,
        points: currentQuestion.points,
      });
      if (isCorrect) {
        toast({ title: '✅ إجابة صحيحة!', description: `+${currentQuestion.points} نقطة` });
      } else {
        toast({ title: '❌ إجابة خاطئة', description: `الإجابة الصحيحة: ${currentQuestion.correct_answer}` });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حفظ الإجابة', variant: 'destructive' });
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setShowResult(false);
    setCurrentIndex((i) => Math.min(i + 1, unanswered.length - 1));
  };

  const userRank = leaderboard?.findIndex((p) => p.id === user?.id) ?? -1;
  const rankIcons = [Crown, Medal, Medal];
  const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

  const isLoading = loadingComp || loadingQ;

  return (
    <AppLayout>
      <div className="min-h-screen pb-20" dir="rtl">
        {/* Header */}
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Swords className="w-6 h-6" />
              <h1 className="text-2xl font-bold">المسابقة الأسبوعية</h1>
            </div>
            {competition && (
              <p className="text-primary-foreground/70">{competition.title}</p>
            )}
          </div>
        </header>

        <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : !competition ? (
            <div className="text-center py-16">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-bold mb-2">لا توجد مسابقة حالياً</h3>
              <p className="text-muted-foreground">ترقب المسابقة الأسبوعية القادمة!</p>
            </div>
          ) : (
            <>
              {/* Score Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Star className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">نقاطك في المسابقة</p>
                        <p className="text-2xl font-bold text-primary">{totalScore}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-muted-foreground">
                        {correctCount}/{(myAnswers?.length || 0)} صحيحة
                      </p>
                      {userRank >= 0 && (
                        <p className="text-sm font-semibold text-primary">المركز #{userRank + 1}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quiz Section */}
              {unanswered.length > 0 && currentQuestion ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">السؤال {(myAnswers?.length || 0) + currentIndex + 1}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        متبقي {unanswered.length - currentIndex}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-base font-medium leading-relaxed">
                      {currentQuestion.question_text}
                    </p>

                    <div className="space-y-2">
                      {(['a', 'b', 'c', 'd'] as const).map((opt) => {
                        const optionKey = `option_${opt}` as 'option_a' | 'option_b' | 'option_c' | 'option_d';
                        const text = currentQuestion[optionKey];
                        if (!text) return null;

                        const isSelected = selectedOption === opt;
                        const isCorrectAnswer = currentQuestion.correct_answer === opt;

                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswer(opt)}
                            disabled={showResult}
                            className={cn(
                              'w-full text-right p-4 rounded-xl border-2 transition-all',
                              !showResult && 'hover:border-primary/50 hover:bg-primary/5',
                              !showResult && !isSelected && 'border-border',
                              showResult && isCorrectAnswer && 'border-green-500 bg-green-500/10',
                              showResult && isSelected && !isCorrectAnswer && 'border-destructive bg-destructive/10',
                              showResult && !isSelected && !isCorrectAnswer && 'border-border opacity-50'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0">
                                {opt.toUpperCase()}
                              </span>
                              <span className="flex-1">{text}</span>
                              {showResult && isCorrectAnswer && (
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                              )}
                              {showResult && isSelected && !isCorrectAnswer && (
                                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {showResult && currentIndex < unanswered.length - 1 && (
                      <Button onClick={handleNext} className="w-full mt-4">
                        السؤال التالي
                      </Button>
                    )}
                    {showResult && currentIndex === unanswered.length - 1 && (
                      <div className="text-center py-4">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                        <p className="font-bold text-lg">أنهيت جميع الأسئلة! 🎉</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : myAnswers && myAnswers.length > 0 ? (
                <Card className="text-center p-8">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2">أنهيت المسابقة! 🏆</h3>
                  <p className="text-muted-foreground mb-4">
                    أجبت على {myAnswers.length} سؤال بنتيجة {correctCount} صحيحة
                  </p>
                  <PointsBadge points={totalScore} size="lg" />
                </Card>
              ) : (
                <Card className="text-center p-8">
                  <Swords className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد أسئلة في هذه المسابقة بعد</p>
                </Card>
              )}

              {/* Competition Leaderboard */}
              {leaderboard && leaderboard.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold">ترتيب المسابقة</h2>
                  </div>
                  <div className="space-y-2">
                    {leaderboard.map((player, index) => {
                      const isMe = player.id === user?.id;
                      const RankIcon = index < 3 ? rankIcons[index] : null;
                      return (
                        <Card
                          key={player.id}
                          className={cn(
                            'p-3 transition-all',
                            isMe && 'ring-2 ring-primary bg-primary/5'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
                                index < 3
                                  ? 'bg-gradient-gold text-accent-foreground'
                                  : 'bg-muted text-muted-foreground'
                              )}
                            >
                              {RankIcon ? (
                                <RankIcon className={cn('w-4 h-4', rankColors[index])} />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={cn('font-medium truncate block', isMe && 'text-primary')}>
                                {player.full_name}
                                {isMe && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mr-2">
                                    أنت
                                  </span>
                                )}
                              </span>
                            </div>
                            <PointsBadge points={player.score} size="sm" />
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
