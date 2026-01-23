import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Mic, Upload, X, Loader2, CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Verse {
  book: string;
  chapter: number;
  verse_start: number;
  verse_end: number | null;
  verse_text: string;
}

interface TopicFormProps {
  initialData?: {
    id?: string;
    title: string;
    description: string;
    interpretation: string;
    points_reward: number;
    verses: Verse[];
    audio_url?: string | null;
    scheduled_for?: string | null;
    is_published?: boolean;
  };
  onSave: (data: {
    title: string;
    description: string;
    interpretation: string;
    points_reward: number;
    verses: Verse[];
    audio_url?: string | null;
    scheduled_for?: string | null;
    is_published?: boolean;
  }) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function TopicForm({ initialData, onSave, onCancel, isSaving }: TopicFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [interpretation, setInterpretation] = useState(initialData?.interpretation || '');
  const [pointsReward, setPointsReward] = useState(initialData?.points_reward || 10);
  const [verses, setVerses] = useState<Verse[]>(initialData?.verses || []);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialData?.audio_url || null);
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(
    initialData?.scheduled_for ? new Date(initialData.scheduled_for) : undefined
  );
  const [isPublished, setIsPublished] = useState(initialData?.is_published ?? false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const addVerse = () => {
    setVerses([...verses, {
      book: '',
      chapter: 1,
      verse_start: 1,
      verse_end: null,
      verse_text: '',
    }]);
  };

  const updateVerse = (index: number, field: keyof Verse, value: string | number | null) => {
    const updated = [...verses];
    updated[index] = { ...updated[index], [field]: value };
    setVerses(updated);
  };

  const removeVerse = (index: number) => {
    setVerses(verses.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('فشل في بدء التسجيل');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const fileName = `admin-recordings/${Date.now()}.webm`;
      const { data, error } = await supabase.storage
        .from('audio')
        .upload(fileName, blob, { contentType: 'audio/webm' });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(data.path);

      setAudioUrl(publicUrl);
      toast.success('تم رفع التسجيل بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('فشل في رفع التسجيل');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast.error('يرجى اختيار ملف صوتي');
      return;
    }

    await uploadAudio(file);
  };

  const removeAudio = () => {
    setAudioUrl(null);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('عنوان الموضوع مطلوب');
      return;
    }
    if (verses.length === 0) {
      toast.error('أضف آية واحدة على الأقل');
      return;
    }

    onSave({
      title,
      description,
      interpretation,
      points_reward: pointsReward,
      verses,
      audio_url: audioUrl,
      scheduled_for: scheduledFor?.toISOString() || null,
      is_published: isPublished,
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label>عنوان الموضوع *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: معمودية يسوع المسيح"
          />
        </div>
        <div>
          <Label>وصف الموضوع</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف مختصر للموضوع..."
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>النقاط</Label>
            <Input
              type="number"
              value={pointsReward}
              onChange={(e) => setPointsReward(parseInt(e.target.value) || 10)}
              min={1}
            />
          </div>
          <div>
            <Label>تاريخ النشر</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-right font-normal",
                    !scheduledFor && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="ml-2 h-4 w-4" />
                  {scheduledFor ? (
                    format(scheduledFor, 'PPP', { locale: ar })
                  ) : (
                    <span>اختر تاريخ</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledFor}
                  onSelect={setScheduledFor}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        {/* Publish Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <Label className="text-base">نشر الموضوع</Label>
            <p className="text-sm text-muted-foreground">
              {isPublished ? 'الموضوع منشور وسيظهر للقراء' : 'الموضوع مسودة'}
            </p>
          </div>
          <Switch
            checked={isPublished}
            onCheckedChange={setIsPublished}
          />
        </div>
      </div>

      {/* Verses */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>الآيات *</Label>
          <Button variant="outline" size="sm" onClick={addVerse}>
            <Plus className="w-4 h-4 ml-1" />
            إضافة آية
          </Button>
        </div>
        
        {verses.map((verse, index) => (
          <Card key={index} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">آية {index + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeVerse(index)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">السفر</Label>
                <Input
                  value={verse.book}
                  onChange={(e) => updateVerse(index, 'book', e.target.value)}
                  placeholder="متى"
                />
              </div>
              <div>
                <Label className="text-xs">الإصحاح</Label>
                <Input
                  type="number"
                  value={verse.chapter}
                  onChange={(e) => updateVerse(index, 'chapter', parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs">من آية</Label>
                <Input
                  type="number"
                  value={verse.verse_start}
                  onChange={(e) => updateVerse(index, 'verse_start', parseInt(e.target.value) || 1)}
                  min={1}
                />
              </div>
              <div>
                <Label className="text-xs">إلى آية (اختياري)</Label>
                <Input
                  type="number"
                  value={verse.verse_end || ''}
                  onChange={(e) => updateVerse(index, 'verse_end', e.target.value ? parseInt(e.target.value) : null)}
                  min={1}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">نص الآية</Label>
              <Textarea
                value={verse.verse_text}
                onChange={(e) => updateVerse(index, 'verse_text', e.target.value)}
                placeholder="اكتب نص الآية هنا..."
                rows={2}
              />
            </div>
          </Card>
        ))}
        
        {verses.length === 0 && (
          <p className="text-center text-muted-foreground py-4">لا توجد آيات. اضغط "إضافة آية"</p>
        )}
      </div>

      {/* Interpretation */}
      <div>
        <Label>التفسير (اختياري)</Label>
        <Textarea
          value={interpretation}
          onChange={(e) => setInterpretation(e.target.value)}
          placeholder="اكتب تفسير الموضوع..."
          rows={4}
        />
      </div>

      {/* Admin Audio Recording */}
      <div className="space-y-3">
        <Label>تسجيل صوتي (اختياري)</Label>
        <p className="text-xs text-muted-foreground">سجّل بصوتك ليستمع إليه القراء</p>
        
        {audioUrl ? (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <audio src={audioUrl} controls className="flex-1 h-10" />
            <Button variant="ghost" size="icon" onClick={removeAudio}>
              <X className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-3">
            <Button
              variant={isRecording ? "destructive" : "outline"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isUploading}
            >
              {isRecording ? (
                <>
                  <Mic className="w-4 h-4 ml-2 animate-pulse" />
                  إيقاف التسجيل
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 ml-2" />
                  تسجيل
                </>
              )}
            </Button>
            
            <label className="cursor-pointer">
              <Button variant="outline" asChild disabled={isUploading}>
                <span>
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 ml-2" />
                  )}
                  رفع ملف صوتي
                </span>
              </Button>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          إلغاء
        </Button>
        <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            'حفظ الموضوع'
          )}
        </Button>
      </div>
    </div>
  );
}