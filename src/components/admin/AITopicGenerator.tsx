import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, Check, X, Eye } from 'lucide-react';
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

interface AITopicGeneratorProps {
  onSave: (topic: GeneratedTopic) => void;
  isSaving: boolean;
}

export function AITopicGenerator({ onSave, isSaving }: AITopicGeneratorProps) {
  const [searchTopic, setSearchTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTopic, setGeneratedTopic] = useState<GeneratedTopic | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-focus input after generation completes
  useEffect(() => {
    if (!isGenerating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isGenerating]);

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
      setSearchTopic('');
      toast.success('تم توليد الموضوع بنجاح!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (generatedTopic) {
      onSave(generatedTopic);
      setGeneratedTopic(null);
      setShowPreview(false);
    }
  };

  const handleCancel = () => {
    setShowPreview(false);
    setGeneratedTopic(null);
  };

  return (
    <div className="space-y-4">
      {/* Generator Card */}
      <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">توليد بالذكاء الاصطناعي</h3>
            <p className="text-sm text-muted-foreground mt-1">اكتب الموضوع والـ AI يجيب الآيات والتفسير</p>
          </div>
          <div className="flex gap-2 w-full max-w-md">
            <Input
              ref={inputRef}
              placeholder="مثال: معمودية يسوع، الغفران، الصلاة..."
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isGenerating && generateTopic()}
              className="flex-1 bg-background/80 border-border/50"
              disabled={isGenerating}
            />
            <Button 
              onClick={generateTopic} 
              disabled={isGenerating || !searchTopic.trim()}
              className="px-6 shadow-md"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
            </Button>
          </div>
          {isGenerating && (
            <p className="text-sm text-muted-foreground animate-pulse">جاري البحث في الكتاب المقدس...</p>
          )}
        </div>
      </Card>

      {/* Preview Card */}
      {showPreview && generatedTopic && (
        <Card className="p-6 border-2 border-accent/30 bg-card/95 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              معاينة الموضوع المولد
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              >
                <X className="w-4 h-4 ml-1" />
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="shadow-md"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 ml-1" />
                )}
                حفظ الموضوع
              </Button>
            </div>
          </div>
          
          <div className="space-y-5">
            <div className="pb-4 border-b border-border/50">
              <h4 className="text-xl font-bold text-primary font-display">{generatedTopic.title}</h4>
              <p className="text-muted-foreground mt-2">{generatedTopic.description}</p>
            </div>
            
            <div className="space-y-3">
              <h5 className="font-semibold flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary">
                  {generatedTopic.verses.length}
                </span>
                الآيات
              </h5>
              {generatedTopic.verses.map((verse, idx) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-xl border border-border/30">
                  <div className="text-sm font-medium text-primary mb-2">
                    {verse.book} {verse.chapter}:{verse.verse_start}
                    {verse.verse_end && verse.verse_end !== verse.verse_start && `-${verse.verse_end}`}
                  </div>
                  <p className="scripture-text leading-relaxed">{verse.verse_text}</p>
                </div>
              ))}
            </div>
            
            {generatedTopic.interpretation && (
              <div className="p-4 bg-gradient-to-br from-accent/10 to-primary/5 rounded-xl border border-accent/20">
                <h5 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  التفسير
                </h5>
                <p className="text-muted-foreground leading-relaxed">{generatedTopic.interpretation}</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
