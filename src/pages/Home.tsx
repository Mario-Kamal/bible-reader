import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { AppLayout } from '@/components/layout/AppLayout';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, ChevronRight, Trophy, Flame } from 'lucide-react';

export default function Home() {
  const { profile, isAdmin } = useAuth();
  const { data: topics, isLoading: topicsLoading } = useTopics();
  const { data: progress, isLoading: progressLoading } = useUserProgress();

  const completedTopicIds = new Set(progress?.map(p => p.topic_id) || []);
  const publishedTopics = topics?.filter(t => t.is_published) || [];
  const totalTopics = publishedTopics.length;
  const completedCount = publishedTopics.filter(t => completedTopicIds.has(t.id)).length;
  const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  // Find next uncompleted topic
  const nextTopic = publishedTopics.find(t => !completedTopicIds.has(t.id));

  const isLoading = topicsLoading || progressLoading;

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-12">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-primary-foreground/70 text-sm">Welcome back,</p>
                <h1 className="text-2xl font-bold">{profile?.full_name || 'Reader'}</h1>
              </div>
              {profile && (
                <PointsBadge points={profile.total_points} size="lg" />
              )}
            </div>

            {/* Progress Card */}
            <Card className="p-6 -mb-16 relative z-10 shadow-lg">
              <div className="flex items-center gap-6">
                <ProgressRing progress={progressPercent} size={80} strokeWidth={6}>
                  <span className="text-lg font-bold">{progressPercent}%</span>
                </ProgressRing>
                <div className="flex-1">
                  <h2 className="font-semibold text-foreground mb-1">Your Journey</h2>
                  <p className="text-sm text-muted-foreground mb-2">
                    {completedCount} of {totalTopics} topics completed
                  </p>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 text-accent">
                      <Flame className="w-4 h-4" />
                      <span className="font-medium">{profile?.topics_completed || 0}</span>
                    </div>
                    <div className="flex items-center gap-1 text-primary">
                      <Trophy className="w-4 h-4" />
                      <span className="font-medium">{profile?.total_points || 0} pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </header>

        {/* Content */}
        <div className="px-4 pt-20 pb-6 max-w-lg mx-auto space-y-6">
          {/* Admin Quick Access */}
          {isAdmin && (
            <Link to="/admin">
              <Card className="p-4 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg">👑</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">Admin Dashboard</h3>
                      <p className="text-sm text-muted-foreground">Manage content & users</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary" />
                </div>
              </Card>
            </Link>
          )}

          {/* Continue Reading */}
          {nextTopic && (
            <section>
              <h2 className="text-lg font-semibold mb-3">Continue Reading</h2>
              <Link to={`/topic/${nextTopic.id}`}>
                <Card className="card-gold p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{nextTopic.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {nextTopic.description || 'Explore this topic from multiple perspectives'}
                      </p>
                      <div className="flex items-center gap-2">
                        <PointsBadge points={nextTopic.points_reward} size="sm" />
                        <span className="text-xs text-muted-foreground">
                          {nextTopic.verses?.length || 0} verses
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full mt-4">
                    Start Reading
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Card>
              </Link>
            </section>
          )}

          {/* Quick Stats */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-primary mb-1">
                  {profile?.topics_completed || 0}
                </div>
                <div className="text-sm text-muted-foreground">Topics Read</div>
              </Card>
              <Card className="p-4 text-center">
                <div className="text-3xl font-bold text-gradient-gold mb-1">
                  {profile?.total_points || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </Card>
            </div>
          </section>

          {/* View All Topics */}
          <Link to="/topics">
            <Button variant="outline" className="w-full">
              View All Topics
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
