import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TopicForm } from '@/components/admin/TopicForm';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminStats } from '@/components/admin/AdminStats';
import { AITopicGenerator } from '@/components/admin/AITopicGenerator';
import { TopicsList } from '@/components/admin/TopicsList';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedTopic {
  title: string;
  description: string;
  interpretation: string;
  verses: {
    book: string;
    chapter: number;
    verse_start: number;
    verse_end: number | null;
    verse_text: string;
  }[];
}

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);

  // Fetch all topics for admin
  const { data: topics } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: async () => {
      const { data } = await supabase.from('topics').select('*, verses(*)').order('order_index');
      return data || [];
    },
  });

  // Fetch user stats
  const { data: userStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { data: activeUsers } = await supabase.from('user_progress').select('user_id').limit(100);
      const uniqueActive = new Set(activeUsers?.map(u => u.user_id)).size;
      return { totalUsers: totalUsers || 0, activeUsers: uniqueActive };
    },
  });

  const saveTopic = useMutation({
    mutationFn: async (topicData: {
      title: string;
      description: string;
      interpretation: string;
      points_reward?: number;
      verses: { book: string; chapter: number; verse_start: number; verse_end: number | null; verse_text: string }[];
      audio_url?: string | null;
    }) => {
      // Create topic
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .insert({
          title: topicData.title,
          description: topicData.description,
          interpretation: topicData.interpretation,
          points_reward: topicData.points_reward || 10,
          order_index: (topics?.length || 0) + 1,
          is_published: false,
          audio_url: topicData.audio_url || null,
        })
        .select()
        .single();
      
      if (topicError) throw topicError;
      
      // Create verses
      if (topicData.verses.length > 0) {
        const versesToInsert = topicData.verses.map((v, idx) => ({
          topic_id: topic.id,
          book: v.book,
          chapter: v.chapter,
          verse_start: v.verse_start,
          verse_end: v.verse_end,
          verse_text: v.verse_text,
          order_index: idx,
        }));
        
        const { error: versesError } = await supabase
          .from('verses')
          .insert(versesToInsert);
        
        if (versesError) throw versesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      setShowManualForm(false);
      toast.success('تم حفظ الموضوع!');
    },
    onError: (error) => {
      toast.error('فشل في الحفظ');
      console.error(error);
    },
  });

  const updateTopic = useMutation({
    mutationFn: async ({ 
      topicId, 
      data 
    }: { 
      topicId: string; 
      data: {
        title: string;
        description: string;
        interpretation: string;
        points_reward: number;
        verses: { book: string; chapter: number; verse_start: number; verse_end: number | null; verse_text: string }[];
        audio_url?: string | null;
      };
    }) => {
      // Update topic
      const { error: topicError } = await supabase
        .from('topics')
        .update({
          title: data.title,
          description: data.description,
          interpretation: data.interpretation,
          points_reward: data.points_reward,
          audio_url: data.audio_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', topicId);
      
      if (topicError) throw topicError;
      
      // Delete existing verses
      await supabase.from('verses').delete().eq('topic_id', topicId);
      
      // Insert new verses
      if (data.verses.length > 0) {
        const versesToInsert = data.verses.map((v, idx) => ({
          topic_id: topicId,
          book: v.book,
          chapter: v.chapter,
          verse_start: v.verse_start,
          verse_end: v.verse_end,
          verse_text: v.verse_text,
          order_index: idx,
        }));
        
        const { error: versesError } = await supabase
          .from('verses')
          .insert(versesToInsert);
        
        if (versesError) throw versesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      setEditingTopic(null);
      toast.success('تم تحديث الموضوع!');
    },
    onError: (error) => {
      toast.error('فشل في التحديث');
      console.error(error);
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('topics').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      toast.success('تم التحديث!');
    },
  });

  const handleAISave = (generatedTopic: GeneratedTopic) => {
    saveTopic.mutate({
      title: generatedTopic.title,
      description: generatedTopic.description,
      interpretation: generatedTopic.interpretation,
      points_reward: 10,
      verses: generatedTopic.verses,
    });
  };

  const editingTopicData = editingTopic ? topics?.find(t => t.id === editingTopic) : null;

  if (!isAdmin) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
          <Card className="p-8 text-center max-w-sm">
            <h2 className="text-xl font-semibold mb-4">غير مصرح</h2>
            <p className="text-muted-foreground mb-6">ليس لديك صلاحية الوصول لهذه الصفحة</p>
            <Button onClick={() => navigate('/home')} className="w-full">العودة للرئيسية</Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background pb-8" dir="rtl">
        <AdminHeader />

        <div className="px-4 py-6 max-w-4xl mx-auto space-y-6 -mt-4">
          {/* Stats */}
          <AdminStats 
            totalUsers={userStats?.totalUsers || 0}
            activeUsers={userStats?.activeUsers || 0}
            topicsCount={topics?.length || 0}
          />

          {/* Add Topic Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manual Add Card */}
            <Card 
              className="p-6 cursor-pointer hover:shadow-lg transition-all duration-200 bg-card/80 backdrop-blur-sm border-border/50 hover:border-primary/30 group"
              onClick={() => setShowManualForm(true)}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">إضافة يدوية</h3>
                  <p className="text-sm text-muted-foreground mt-1">أضف موضوع وآيات يدوياً</p>
                </div>
              </div>
            </Card>
            
            {/* AI Generator is now a standalone component */}
            <div className="md:col-span-1">
              <AITopicGenerator 
                onSave={handleAISave}
                isSaving={saveTopic.isPending}
              />
            </div>
          </div>

          {/* Topics List */}
          <TopicsList 
            topics={topics || []}
            onEdit={setEditingTopic}
            onTogglePublish={(id, published) => togglePublish.mutate({ id, published })}
          />
        </div>

        {/* Manual Form Dialog */}
        <Dialog open={showManualForm} onOpenChange={setShowManualForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة موضوع جديد</DialogTitle>
            </DialogHeader>
            <TopicForm
              onSave={(data) => saveTopic.mutate(data)}
              onCancel={() => setShowManualForm(false)}
              isSaving={saveTopic.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Form Dialog */}
        <Dialog open={!!editingTopic} onOpenChange={(open) => !open && setEditingTopic(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle>تعديل الموضوع</DialogTitle>
            </DialogHeader>
            {editingTopicData && (
              <TopicForm
                initialData={{
                  id: editingTopicData.id,
                  title: editingTopicData.title,
                  description: editingTopicData.description ?? '',
                  interpretation: editingTopicData.interpretation || '',
                  points_reward: editingTopicData.points_reward,
                  verses: editingTopicData.verses?.map(v => ({
                    book: v.book,
                    chapter: v.chapter,
                    verse_start: v.verse_start,
                    verse_end: v.verse_end,
                    verse_text: v.verse_text,
                  })) || [],
                  audio_url: editingTopicData.audio_url,
                }}
                onSave={(data) => updateTopic.mutate({ topicId: editingTopic!, data })}
                onCancel={() => setEditingTopic(null)}
                isSaving={updateTopic.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
