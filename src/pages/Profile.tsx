import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTopics, useUserProgress } from '@/hooks/useTopics';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { PointsBadge } from '@/components/ui/PointsBadge';
import { NotificationToggle } from '@/components/notifications/NotificationPrompt';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  LogOut, 
  BookOpen, 
  Trophy, 
  Target, 
  Calendar,
  Settings,
  Bell,
  Pencil
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { profile, signOut, isAdmin, refreshProfile } = useAuth();
  const { data: topics } = useTopics();
  const { data: progress } = useUserProgress();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);

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
      label: 'مواضيع مقروءة',
      value: completedCount,
      color: 'text-primary',
    },
    {
      icon: Trophy,
      label: 'إجمالي النقاط',
      value: profile?.total_points || 0,
      color: 'text-accent',
    },
    {
      icon: Target,
      label: 'التقدم',
      value: `${progressPercent}%`,
      color: 'text-success',
    },
  ];

  return (
    <AppLayout>
      <div className="min-h-screen" dir="rtl">
        {/* Header */}
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-16">
          <div className="max-w-lg mx-auto text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="w-20 h-20 border-4 border-primary-foreground/20">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name} />
                <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => setShowEditDialog(true)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary-foreground text-primary flex items-center justify-center shadow-lg hover:bg-primary-foreground/90 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <h1 className="text-2xl font-bold mb-1">{profile?.full_name || 'قارئ'}</h1>
            <p className="text-primary-foreground/70">{profile?.phone}</p>
            {isAdmin && (
              <span className="inline-block mt-2 text-xs bg-accent/20 text-accent px-3 py-1 rounded-full font-medium">
                مدير
              </span>
            )}
          </div>
        </header>

        {/* Progress Card */}
        <div className="px-4 -mt-10 max-w-lg mx-auto">
          <Card className="p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">تقدمك</h2>
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
                  <span className="text-muted-foreground">مكتمل</span>
                  <span className="font-medium">{completedCount} موضوع</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">متبقي</span>
                  <span className="font-medium">{totalTopics - completedCount} موضوع</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الإجمالي</span>
                  <span className="font-medium">{totalTopics} موضوع</span>
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
                <p className="text-sm text-muted-foreground">عضو منذ</p>
                <p className="font-medium">
                  {profile?.created_at 
                    ? format(new Date(profile.created_at), 'd MMMM yyyy', { locale: ar })
                    : 'غير معروف'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications Settings */}
        <div className="px-4 py-4 max-w-lg mx-auto">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">الإشعارات اليومية</p>
                  <p className="text-xs text-muted-foreground">تذكير بموضوع القراءة الجديد</p>
                </div>
              </div>
              <NotificationToggle />
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setShowEditDialog(true)}
          >
            <Pencil className="w-4 h-4 ml-2" />
            تعديل الملف الشخصي
          </Button>

          {isAdmin && (
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/admin')}
            >
              <Settings className="w-4 h-4 ml-2" />
              لوحة التحكم
            </Button>
          )}
          
          <Button 
            variant="outline" 
            className="w-full text-destructive hover:text-destructive" 
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Edit Profile Dialog */}
        <EditProfileDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          profile={profile}
          onSuccess={refreshProfile}
        />
      </div>
    </AppLayout>
  );
}
