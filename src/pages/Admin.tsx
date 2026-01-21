import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TopicForm } from '@/components/admin/TopicForm';
import { ArrowRight, Sparkles, Users, BookOpen, BarChart3, Loader2, Check, X, Eye, Plus, Pencil, Mic } from 'lucide-react';
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
  
  const [searchTopic, setSearchTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTopic, setGeneratedTopic] = useState<GeneratedTopic | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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

  const generateTopic = async () => {
    if (!searchTopic.trim()) {
      toast.error('اكتب موضوع للبحث');
      return;
    }
    
    setIsGenerating(true);
    setGeneratedTopic(null);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-topic`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ topicTitle: searchTopic }),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'فشل في التوليد');
      }
      
      const data = await response.json();
      setGeneratedTopic(data);
      setShowPreview(true);
      toast.success('تم توليد الموضوع بنجاح!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveTopic = useMutation({
    mutationFn: async (topicData?: {
      title: string;
      description: string;
      interpretation: string;
      points_reward: number;
      verses: { book: string; chapter: number; verse_start: number; verse_end: number | null; verse_text: string }[];
      audio_url?: string | null;
    }) => {
      const data = topicData || (generatedTopic ? {
        title: generatedTopic.title,
        description: generatedTopic.description,
        interpretation: generatedTopic.interpretation,
        points_reward: 10,
        verses: generatedTopic.verses,
        audio_url: null,
      } : null);
      
      if (!data) return;
      
      // Create topic
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .insert({
          title: data.title,
          description: data.description,
          interpretation: data.interpretation,
          points_reward: data.points_reward,
          order_index: (topics?.length || 0) + 1,
          is_published: false,
          audio_url: data.audio_url,
        })
        .select()
        .single();
      
      if (topicError) throw topicError;
      
      // Create verses
      if (data.verses.length > 0) {
        const versesToInsert = data.verses.map((v, idx) => ({
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
      setGeneratedTopic(null);
      setShowPreview(false);
      setShowManualForm(false);
      setSearchTopic('');
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

  const editingTopicData = editingTopic ? topics?.find(t => t.id === editingTopic) : null;

  if (!isAdmin) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">غير مصرح</h2>
            <Button onClick={() => navigate('/home')}>العودة للرئيسية</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <div className="min-h-screen pb-8" dir="rtl">
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-6">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="text-primary-foreground">
              <ArrowRight className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">لوحة التحكم</h1>
              <p className="text-primary-foreground/70">إدارة المحتوى والمستخدمين</p>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
              <div className="text-xs text-muted-foreground">إجمالي المستخدمين</div>
            </Card>
            <Card className="p-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold">{userStats?.activeUsers || 0}</div>
              <div className="text-xs text-muted-foreground">قراء نشطين</div>
            </Card>
            <Card className="p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold">{topics?.length || 0}</div>
              <div className="text-xs text-muted-foreground">المواضيع</div>
            </Card>
          </div>

          {/* Add Topic Options */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className="card-gold p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setShowManualForm(true)}
            >
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">إضافة يدوية</h3>
                <p className="text-xs text-muted-foreground">أضف موضوع وآيات يدوياً</p>
              </div>
            </Card>
            
            <Card className="card-gold p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold">توليد بالذكاء الاصطناعي</h3>
                <p className="text-xs text-muted-foreground mb-2">اكتب الموضوع والـ AI يجيب الآيات</p>
                <div className="flex gap-2 w-full">
                  <Input
                    placeholder="معمودية يسوع..."
                    value={searchTopic}
                    onChange={(e) => setSearchTopic(e.target.value)}
                    className="flex-1 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && generateTopic()}
                  />
                  <Button size="sm" onClick={generateTopic} disabled={isGenerating}>
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Generated Topic Preview */}
          {showPreview && generatedTopic && (
            <Card className="p-6 border-2 border-accent/50 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  معاينة الموضوع المولد
                </h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPreview(false);
                      setGeneratedTopic(null);
                    }}
                  >
                    <X className="w-4 h-4 ml-1" />
                    إلغاء
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => saveTopic.mutate(undefined)}
                    disabled={saveTopic.isPending}
                  >
                    {saveTopic.isPending ? (
                      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 ml-1" />
                    )}
                    حفظ الموضوع
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-primary">{generatedTopic.title}</h4>
                  <p className="text-muted-foreground mt-1">{generatedTopic.description}</p>
                </div>
                
                <div className="space-y-3">
                  <h5 className="font-semibold">الآيات ({generatedTopic.verses.length})</h5>
                  {generatedTopic.verses.map((verse, idx) => (
                    <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium text-primary mb-2">
                        {verse.book} {verse.chapter}:{verse.verse_start}
                        {verse.verse_end && verse.verse_end !== verse.verse_start && `-${verse.verse_end}`}
                      </div>
                      <p className="scripture-text">{verse.verse_text}</p>
                    </div>
                  ))}
                </div>
                
                {generatedTopic.interpretation && (
                  <div className="p-4 bg-accent/10 rounded-lg">
                    <h5 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      التفسير
                    </h5>
                    <p className="text-muted-foreground leading-relaxed">{generatedTopic.interpretation}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Topics List */}
          <Card className="p-4">
            <h2 className="font-semibold mb-4">المواضيع المحفوظة</h2>
            <div className="space-y-2">
              {topics?.map(topic => (
                <div key={topic.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {topic.title}
                        {topic.audio_url && <Mic className="w-3 h-3 text-primary" />}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {topic.verses?.length || 0} آية • {topic.points_reward} نقطة
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTopic(topic.id)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{topic.is_published ? 'منشور' : 'مسودة'}</span>
                      <Switch 
                        checked={topic.is_published} 
                        onCheckedChange={checked => togglePublish.mutate({ id: topic.id, published: checked })} 
                      />
                    </div>
                  </div>
                </div>
              ))}
              {!topics?.length && (
                <p className="text-center text-muted-foreground py-4">لا توجد مواضيع بعد</p>
              )}
            </div>
          </Card>
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
