import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, Sparkles, Check, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Topic, Verse } from '@/hooks/useTopics';

interface ShareableTopicCardProps {
  topic: Topic;
  trigger?: React.ReactNode;
}

const themes = [
  {
    id: 'sapphire',
    name: 'ياقوت',
    gradient: 'linear-gradient(135deg, hsl(222, 47%, 20%) 0%, hsl(222, 47%, 35%) 50%, hsl(45, 93%, 47%) 150%)',
    accent: 'text-amber-400',
    accentBg: 'bg-amber-400/20',
    textColor: 'text-white',
    subtleText: 'text-white/50',
  },
  {
    id: 'sunset',
    name: 'غروب',
    gradient: 'linear-gradient(135deg, hsl(350, 70%, 35%) 0%, hsl(25, 90%, 50%) 100%)',
    accent: 'text-amber-200',
    accentBg: 'bg-amber-200/20',
    textColor: 'text-white',
    subtleText: 'text-white/60',
  },
  {
    id: 'forest',
    name: 'غابة',
    gradient: 'linear-gradient(135deg, hsl(160, 50%, 20%) 0%, hsl(140, 40%, 35%) 100%)',
    accent: 'text-emerald-300',
    accentBg: 'bg-emerald-300/20',
    textColor: 'text-white',
    subtleText: 'text-white/60',
  },
  {
    id: 'royal',
    name: 'ملكي',
    gradient: 'linear-gradient(135deg, hsl(270, 50%, 25%) 0%, hsl(280, 60%, 40%) 100%)',
    accent: 'text-purple-200',
    accentBg: 'bg-purple-200/20',
    textColor: 'text-white',
    subtleText: 'text-white/60',
  },
  {
    id: 'ocean',
    name: 'محيط',
    gradient: 'linear-gradient(135deg, hsl(200, 70%, 25%) 0%, hsl(190, 80%, 40%) 100%)',
    accent: 'text-cyan-200',
    accentBg: 'bg-cyan-200/20',
    textColor: 'text-white',
    subtleText: 'text-white/60',
  },
  {
    id: 'cream',
    name: 'كريمي',
    gradient: 'linear-gradient(135deg, hsl(40, 30%, 90%) 0%, hsl(35, 40%, 85%) 100%)',
    accent: 'text-amber-700',
    accentBg: 'bg-amber-700/10',
    textColor: 'text-stone-800',
    subtleText: 'text-stone-500',
  },
];

export function ShareableTopicCard({ topic, trigger }: ShareableTopicCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);

  // Get the first verse for preview
  const firstVerse = topic.verses?.sort((a, b) => a.order_index - b.order_index)[0];

  const generateImage = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) {
        toast.error('فشل في إنشاء الصورة');
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `topic-${topic.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('تم تحميل الصورة');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) {
        toast.error('فشل في إنشاء الصورة');
        return;
      }

      const file = new File([blob], `topic-${topic.id}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: topic.title,
          text: topic.description || topic.title,
          files: [file],
        });
      } else {
        await handleDownload();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
        await handleDownload();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const formatVerseReference = (verse: Verse) => {
    if (verse.verse_end && verse.verse_end !== verse.verse_start) {
      return `${verse.book} ${verse.chapter}:${verse.verse_start}-${verse.verse_end}`;
    }
    return `${verse.book} ${verse.chapter}:${verse.verse_start}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="w-4 h-4" />
            مشاركة كصورة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            مشاركة الموضوع
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          {/* Theme Selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme)}
                className={cn(
                  "relative flex-shrink-0 w-12 h-12 rounded-xl transition-all",
                  selectedTheme.id === theme.id && "ring-2 ring-primary ring-offset-2"
                )}
                style={{ background: theme.gradient }}
              >
                {selectedTheme.id === theme.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Shareable Card Design */}
          <div 
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl"
            style={{ background: selectedTheme.gradient }}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-white">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.3"/>
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.3"/>
                <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.3"/>
                <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.3"/>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10">
              <svg viewBox="0 0 100 100" className={cn("w-full h-full fill-current", selectedTheme.accent)}>
                <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
              </svg>
            </div>
            
            {/* Content */}
            <div className={cn("relative z-10 p-6", selectedTheme.textColor)}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedTheme.accentBg)}>
                  <BookOpen className={cn("w-5 h-5", selectedTheme.accent)} />
                </div>
                <div>
                  <span className={cn("font-semibold text-xs block", selectedTheme.accent)}>موضوع اليوم</span>
                  <span className={cn("text-xs", selectedTheme.subtleText)}>رحلة الكتاب المقدس</span>
                </div>
              </div>
              
              {/* Topic Title */}
              <h2 className="text-xl font-bold mb-3">
                {topic.title}
              </h2>

              {/* Description */}
              {topic.description && (
                <p className={cn("text-sm leading-relaxed mb-4 line-clamp-2", selectedTheme.subtleText)}>
                  {topic.description}
                </p>
              )}
              
              {/* Featured Verse */}
              {firstVerse && (
                <div className={cn("rounded-xl p-4 mb-4", selectedTheme.accentBg)}>
                  <p className="text-sm leading-relaxed font-serif mb-2" style={{ fontFamily: 'serif' }}>
                    "{firstVerse.verse_text.length > 150 
                      ? firstVerse.verse_text.slice(0, 150) + '...' 
                      : firstVerse.verse_text}"
                  </p>
                  <p className={cn("text-xs font-medium", selectedTheme.accent)}>
                    — {formatVerseReference(firstVerse)}
                  </p>
                </div>
              )}
              
              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className={cn("flex items-center gap-2 text-sm", selectedTheme.accent)}>
                  <span>🏆</span>
                  <span>{topic.points_reward} نقطة</span>
                </div>
                <div className={cn("flex items-center gap-1 text-xs", selectedTheme.subtleText)}>
                  <span>✝️</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button 
              onClick={handleShare} 
              disabled={isGenerating}
              className="flex-1 gap-2"
            >
              <Share2 className="w-4 h-4" />
              {isGenerating ? 'جاري...' : 'مشاركة'}
            </Button>
            <Button 
              onClick={handleDownload} 
              disabled={isGenerating}
              variant="outline"
              className="flex-1 gap-2"
            >
              <Download className="w-4 h-4" />
              تحميل
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
