import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
  verse?: string;
}

export function ShareButton({ title, text, verse, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  
  // Use published URL or current location
  const baseUrl = 'https://bible-reader.lovable.app';
  const currentPath = window.location.pathname;
  const shareUrl = url || `${baseUrl}${currentPath}`;
  
  const shareText = verse 
    ? `📖 ${title}\n\n"${verse}"\n\n${text}`
    : `📖 ${title}\n\n${text}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      toast.success('تم نسخ النص');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('فشل في النسخ');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTelegram = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank');
  };

  const handleTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          مشاركة
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="gap-2 cursor-pointer">
            <Share2 className="w-4 h-4" />
            مشاركة
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleWhatsApp} className="gap-2 cursor-pointer">
          <MessageCircle className="w-4 h-4 text-green-500" />
          واتساب
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTelegram} className="gap-2 cursor-pointer">
          <Send className="w-4 h-4 text-blue-500" />
          تيليجرام
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleFacebook} className="gap-2 cursor-pointer">
          <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          فيسبوك
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTwitter} className="gap-2 cursor-pointer">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          تويتر
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy} className="gap-2 cursor-pointer">
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          نسخ الرابط
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}