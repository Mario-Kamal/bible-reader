import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Share2, Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { DailyVerse } from '@/hooks/useDailyVerse';

interface ShareableVerseCardProps {
  verse: DailyVerse;
}

export function ShareableVerseCard({ verse }: ShareableVerseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [open, setOpen] = useState(false);

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
      link.download = `verse-${verse.verse_date}.png`;
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

      const file = new File([blob], `verse-${verse.verse_date}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'آية اليوم',
          text: `"${verse.verse_text}" - ${verse.book} ${verse.chapter}:${verse.verse_number}`,
          files: [file],
        });
      } else {
        // Fallback: download the image
        handleDownload();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
        // Fallback to download
        await handleDownload();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Share2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            مشاركة آية اليوم
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4">
          {/* Shareable Card Design */}
          <div 
            ref={cardRef}
            className="relative overflow-hidden rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, hsl(222, 47%, 20%) 0%, hsl(222, 47%, 35%) 50%, hsl(45, 93%, 47%) 150%)',
            }}
          >
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-white">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </svg>
            </div>
            <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-amber-400">
                <path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="relative z-10 p-6 text-white">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center">
                  <span className="text-amber-400 text-lg">📖</span>
                </div>
                <span className="text-amber-400 font-semibold text-sm">آية اليوم</span>
              </div>
              
              {/* Verse Text */}
              <div className="mb-6">
                <p className="text-lg leading-relaxed font-serif" style={{ fontFamily: 'serif' }}>
                  "{verse.verse_text}"
                </p>
              </div>
              
              {/* Reference */}
              <div className="flex items-center justify-between">
                <span className="text-amber-400/90 text-sm font-medium">
                  — {verse.book} {verse.chapter}:{verse.verse_number}
                </span>
                <div className="flex items-center gap-1 text-white/50 text-xs">
                  <span>رحلة الكتاب المقدس</span>
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
