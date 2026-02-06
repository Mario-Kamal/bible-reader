import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Pause, VolumeX, Loader2 } from 'lucide-react';

interface AIReaderProps {
  text: string;
}

export function AIReader({ text }: AIReaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playWithElevenLabs = useCallback(async () => {
    // Check cache first
    const cacheKey = text.substring(0, 100);
    const cachedUrl = audioCacheRef.current.get(cacheKey);
    
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
      return true;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Cache it
      audioCacheRef.current.set(cacheKey, audioUrl);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        console.error('Audio playback error');
      };
      
      await audio.play();
      setIsPlaying(true);
      return true;
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [text]);

  // Fallback to browser Speech API
  const playWithBrowserTTS = useCallback(() => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.pitch = 0.9;
    
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) utterance.voice = arabicVoice;
    
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }, [text]);

  const togglePlay = async () => {
    if (isPlaying) {
      stopAudio();
      window.speechSynthesis?.cancel();
      return;
    }

    // Try ElevenLabs first, fallback to browser TTS
    const success = await playWithElevenLabs();
    if (!success) {
      playWithBrowserTTS();
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={togglePlay}
      disabled={isLoading}
      className="h-8 w-8 hover:bg-primary/10"
      title="استمع"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 text-primary animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-4 h-4 text-primary" />
      ) : (
        <Volume2 className="w-4 h-4 text-primary" />
      )}
    </Button>
  );
}
