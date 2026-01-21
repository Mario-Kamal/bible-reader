import { useLeaderboard } from '@/hooks/useTopics';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { Trophy, Medal, Crown, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
const rankIcons = [Crown, Medal, Medal];
const rankColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
export default function Leaderboard() {
  const {
    data: leaderboard,
    isLoading
  } = useLeaderboard();
  const {
    user
  } = useAuth();
  const userRank = leaderboard?.findIndex(p => p.id === user?.id) ?? -1;
  return <AppLayout>
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-6">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-6 h-6" />
              <h1 className="text-2xl font-bold">الترتيب</h1>
            </div>
            <p className="text-primary-foreground/70">
              أفضل القراء هذا الموسم
            </p>
          </div>
        </header>

        {/* Your Position */}
        {userRank >= 0 && <div className="px-4 pt-4 max-w-lg mx-auto">
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  #{userRank + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">ترتيبك</p>
                  <p className="font-semibold">استمر في القراءة للصعود!</p>
                </div>
              </div>
            </Card>
          </div>}

        {/* Leaderboard List */}
        <div className="px-4 py-6 max-w-lg mx-auto">
          {isLoading ? <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div> : !leaderboard?.length ? <div className="text-center py-12">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد ترتيب بعد</h3>
              <p className="text-muted-foreground">
                ابدأ القراءة لتظهر في الترتيب!
              </p>
            </div> : <div className="space-y-2">
              {leaderboard.map((player, index) => {
            const isCurrentUser = player.id === user?.id;
            const RankIcon = index < 3 ? rankIcons[index] : null;
            return <Card key={player.id} className={cn("p-4 transition-all animate-fade-in", isCurrentUser && "ring-2 ring-primary bg-primary/5", index < 3 && "border-accent/30")} style={{
              animationDelay: `${index * 50}ms`
            }}>
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary bg-primary", index < 3 ? "bg-gradient-gold text-accent-foreground" : "bg-muted text-muted-foreground")}>
                        {RankIcon ? <Zap className={cn("w-5 h-5 border-destructive-foreground text-primary-foreground bg-primary-foreground", rankColors[index])} /> : index + 1}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("font-semibold truncate", isCurrentUser && "text-primary")}>
                            {player.full_name}
                          </span>
                          {isCurrentUser && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              أنت
                            </span>}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {player.topics_completed} موضوع مكتمل
                        </p>
                      </div>

                      {/* Points */}
                      <PointsBadge points={player.total_points} size={index < 3 ? 'md' : 'sm'} />
                    </div>
                  </Card>;
          })}
            </div>}
        </div>
      </div>
    </AppLayout>;
}