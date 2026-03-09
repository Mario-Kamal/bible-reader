import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Clock, Plus, Trash2, Loader2, Bell, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ScheduledNotifications() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['scheduled-notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('scheduled_notifications')
        .select('*')
        .order('scheduled_at', { ascending: true });
      return data || [];
    },
  });

  const createNotification = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('scheduled_notifications').insert({
        title,
        body,
        scheduled_at: new Date(scheduledAt).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      setShowForm(false);
      setTitle('');
      setBody('');
      setScheduledAt('');
      toast.success('تم جدولة الإشعار بنجاح!');
    },
    onError: () => toast.error('فشل في جدولة الإشعار'),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('scheduled_notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-notifications'] });
      toast.success('تم حذف الإشعار');
    },
  });

  const pendingNotifications = notifications?.filter(n => !n.sent) || [];
  const sentNotifications = notifications?.filter(n => n.sent) || [];

  return (
    <Card className="p-5 bg-card/80 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">الإشعارات المجدولة</h3>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="gap-1">
          <Plus className="w-4 h-4" />
          جدولة إشعار
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : pendingNotifications.length === 0 && sentNotifications.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">لا يوجد إشعارات مجدولة</p>
      ) : (
        <div className="space-y-3">
          {pendingNotifications.map(n => (
            <div key={n.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/30">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">{n.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                <p className="text-xs text-primary mt-1">
                  {new Date(n.scheduled_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => deleteNotification.mutate(n.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {sentNotifications.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground font-medium mt-4">تم إرسالها</p>
              {sentNotifications.slice(0, 5).map(n => (
                <div key={n.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20 opacity-60">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-sm">{n.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      أُرسل: {n.sent_at ? new Date(n.sent_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>جدولة إشعار جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>عنوان الإشعار</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثلاً: تذكير بالقراءة اليومية" />
            </div>
            <div>
              <Label>نص الإشعار</Label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="محتوى الإشعار..." />
            </div>
            <div>
              <Label>وقت الإرسال</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
            </div>
            <Button
              onClick={() => createNotification.mutate()}
              disabled={!title || !body || !scheduledAt || createNotification.isPending}
              className="w-full"
            >
              {createNotification.isPending ? (
                <><Loader2 className="w-4 h-4 ml-2 animate-spin" />جاري الحفظ...</>
              ) : (
                'جدولة الإشعار'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
