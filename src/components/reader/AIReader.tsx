import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Pause, VolumeX } from 'lucide-react';

interface AIReaderProps {
  text: string;
}

export function AIReader({ text }: AIReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
    }
    
    // Cleanup on unmount
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

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
    utterance.lang = 'ar-SA'; // Arabic
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1;

    // Try to find an Arabic voice
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(voice => 
      voice.lang.startsWith('ar') || voice.name.includes('Arabic')
    );
    if (arabicVoice) {
      utterance.voice = arabicVoice;
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
      className="h-8 w-8"
    >
      {isPlaying ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </Button>
  );
}
