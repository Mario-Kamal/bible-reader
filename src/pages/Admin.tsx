import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Users, BookOpen, BarChart3, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

export default function Admin() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', interpretation: '', points_reward: 10 });

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

  const createTopic = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('topics').insert({
        title: newTopic.title,
        description: newTopic.description,
        interpretation: newTopic.interpretation,
        points_reward: newTopic.points_reward,
        order_index: (topics?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      setIsAddingTopic(false);
      setNewTopic({ title: '', description: '', interpretation: '', points_reward: 10 });
      toast.success('Topic created!');
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase.from('topics').update({ is_published: published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topics'] });
      toast.success('Topic updated!');
    },
  });

  if (!isAdmin) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Access Denied</h2>
            <Button onClick={() => navigate('/home')}>Go Home</Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <div className="min-h-screen pb-8">
        <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-6">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="text-primary-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-primary-foreground/70">Manage content & users</p>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 max-w-4xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </Card>
            <Card className="p-4 text-center">
              <BarChart3 className="w-6 h-6 mx-auto mb-2 text-success" />
              <div className="text-2xl font-bold">{userStats?.activeUsers || 0}</div>
              <div className="text-xs text-muted-foreground">Active Readers</div>
            </Card>
            <Card className="p-4 text-center">
              <BookOpen className="w-6 h-6 mx-auto mb-2 text-accent" />
              <div className="text-2xl font-bold">{topics?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Topics</div>
            </Card>
          </div>

          {/* Topics Management */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Topics</h2>
              <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Topic</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Topic</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label>Title</Label>
                      <Input value={newTopic.title} onChange={e => setNewTopic({ ...newTopic, title: e.target.value })} placeholder="e.g., Baptism" />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={newTopic.description} onChange={e => setNewTopic({ ...newTopic, description: e.target.value })} placeholder="Brief description..." />
                    </div>
                    <div>
                      <Label>Interpretation</Label>
                      <Textarea value={newTopic.interpretation} onChange={e => setNewTopic({ ...newTopic, interpretation: e.target.value })} placeholder="Your interpretation..." />
                    </div>
                    <div>
                      <Label>Points Reward</Label>
                      <Input type="number" value={newTopic.points_reward} onChange={e => setNewTopic({ ...newTopic, points_reward: Number(e.target.value) })} />
                    </div>
                    <Button onClick={() => createTopic.mutate()} disabled={!newTopic.title || createTopic.isPending} className="w-full">
                      Create Topic
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-2">
              {topics?.map(topic => (
                <div key={topic.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{topic.title}</p>
                    <p className="text-xs text-muted-foreground">{topic.verses?.length || 0} verses • {topic.points_reward} pts</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{topic.is_published ? 'Published' : 'Draft'}</span>
                      <Switch checked={topic.is_published} onCheckedChange={checked => togglePublish.mutate({ id: topic.id, published: checked })} />
                    </div>
                  </div>
                </div>
              ))}
              {!topics?.length && <p className="text-center text-muted-foreground py-4">No topics yet</p>}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
