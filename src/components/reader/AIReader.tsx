import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Pause, VolumeX } from 'lucide-react';

interface AIReaderProps {
  text: string;
}

export function AIReader({ text }: AIReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load voices when available
  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Load voices immediately if available
    loadVoices();

    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Cleanup on unmount
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Find the best male Arabic voice
  const getMaleArabicVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (voices.length === 0) return null;

    // Keywords that typically indicate male voices
    const maleKeywords = ['male', 'man', 'رجل', 'ذكر', 'majed', 'maged', 'tarik', 'tariq', 'ahmed', 'omar', 'fahad'];
    
    // First: Try to find a male Arabic voice
    const maleArabicVoice = voices.find(voice => {
      const isArabic = voice.lang.startsWith('ar');
      const nameLower = voice.name.toLowerCase();
      const isMale = maleKeywords.some(keyword => nameLower.includes(keyword));
      return isArabic && isMale;
    });
    
    if (maleArabicVoice) return maleArabicVoice;

    // Second: Try to find any Arabic voice (prefer non-female)
    const femaleKeywords = ['female', 'woman', 'أنثى', 'امرأة', 'maryam', 'laila', 'sara', 'fatima', 'zeina', 'hala'];
    const arabicVoices = voices.filter(voice => voice.lang.startsWith('ar'));
    
    // Prefer voices without female keywords
    const nonFemaleArabicVoice = arabicVoices.find(voice => {
      const nameLower = voice.name.toLowerCase();
      return !femaleKeywords.some(keyword => nameLower.includes(keyword));
    });

    if (nonFemaleArabicVoice) return nonFemaleArabicVoice;

    // Third: Return any Arabic voice
    if (arabicVoices.length > 0) return arabicVoices[0];

    // Fourth: Return any voice as fallback
    return null;
  }, [voices]);

  const togglePlay = () => {
    if (!('speechSynthesis' in window)) {
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 0.9; // Lower pitch for male-like voice

    // Try to find a male Arabic voice
    const selectedVoice = getMaleArabicVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  if (!isSupported) {
    return (
      <Button variant="ghost" size="icon" disabled className="h-8 w-8">
        <VolumeX className="w-4 h-4 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={togglePlay}
      className="h-8 w-8 hover:bg-primary/10"
      title="استمع بصوت ذكوري"
    >
      {isPlaying ? (
        <Pause className="w-4 h-4 text-primary" />
      ) : (
        <Volume2 className="w-4 h-4 text-primary" />
      )}
    </Button>
  );
}
