import { useAuth } from '@/contexts/AuthContext';
import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { 
  User, 
  LogOut, 
  BookOpen, 
  Trophy, 
  Target, 
  Calendar,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { profile, signOut, isAdmin } = useAuth();
  const { data: topics } = useTopics();
  const { data: progress } = useUserProgress();
  const navigate = useNavigate();

  const publishedTopics = topics?.filter(t => t.is_published) || [];
  const totalTopics = publishedTopics.length;
  const completedCount = profile?.topics_completed || 0;
  const progressPercent = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const stats = [
    {
      icon: BookOpen,
      label: 'Topics Read',
      value: completedCount,
      color: 'text-primary',
    },
    {
      icon: Trophy,
      label: 'Total Points',
      value: profile?.total_points || 0,
      color: 'text-accent',
    },
    {
      icon: Target,
      label: 'Progress',
      value: `${progressPercent}%`,
      color: 'text-success',
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Header */}
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-foreground/10 mb-4">
              <User className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold mb-1">{profile?.full_name || 'Reader'}</h1>
            <p className="text-primary-foreground/70">{profile?.phone}</p>
            {isAdmin && (
              <span className="inline-block mt-2 text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-medium">
                Admin
              </span>
            )}
          </div>
        </header>

        {/* Progress Card */}
        <div className="px-4 -mt-10 max-w-lg mx-auto">
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Your Progress</h2>
              <PointsBadge points={profile?.total_points || 0} />
            </div>
            
            <div className="flex items-center gap-6">
              <ProgressRing progress={progressPercent} size={100} strokeWidth={8}>
                <div className="text-center">
                  <span className="text-2xl font-bold">{progressPercent}%</span>
                </div>
              </ProgressRing>
              
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-medium">{completedCount} topics</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium">{totalTopics - completedCount} topics</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Available</span>
                  <span className="font-medium">{totalTopics} topics</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Stats Grid */}
        <div className="px-4 py-6 max-w-lg mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="p-4 text-center">
                <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Member Since */}
        <div className="px-4 max-w-lg mx-auto">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">
                  {profile?.created_at 
                    ? format(new Date(profile.created_at), 'MMMM d, yyyy')
                    : 'Unknown'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="px-4 py-6 max-w-lg mx-auto space-y-3">
          {isAdmin && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/admin')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive" 
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
