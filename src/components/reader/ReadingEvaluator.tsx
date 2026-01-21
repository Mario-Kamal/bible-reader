import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Loader2, Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ReadingEvaluatorProps {
  expectedText: string;
  onComplete?: (accuracy: number) => void;
}

interface EvaluationResult {
  accuracy: number;
  correctWords: number;
  totalWords: number;
  feedback: string;
  encouragement: string;
  spokenText: string;
}

// Check if browser supports speech recognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function ReadingEvaluator({ expectedText, onComplete }: ReadingEvaluatorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startRecording = () => {
    if (!SpeechRecognition) {
      toast.error('المتصفح لا يدعم التعرف على الصوت');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA'; // Arabic (Saudi Arabia)
      recognition.continuous = true;
      recognition.interimResults = true;

      let finalTranscript = '';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          toast.error('يرجى السماح بالوصول للميكروفون');
        } else {
          toast.error('حدث خطأ في التعرف على الصوت');
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        if (isRecording && finalTranscript) {
          evaluateReading(finalTranscript.trim());
        }
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
      setTranscript('');
      setResult(null);
    } catch (error) {
      console.error('Failed to start recognition:', error);
      toast.error('فشل في بدء التسجيل');
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  const evaluateReading = async (spokenText: string) => {
    if (!spokenText.trim()) {
      toast.error('لم يتم التعرف على أي كلام. حاول مرة أخرى.');
      return;
    }

    setIsEvaluating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-reading`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ spokenText, expectedText }),
        }
      );

      if (!response.ok) {
        throw new Error('Evaluation failed');
      }

      const evaluation: EvaluationResult = await response.json();
      setResult(evaluation);
      onComplete?.(evaluation.accuracy);
      
      if (evaluation.accuracy >= 80) {
        toast.success('ممتاز! قراءة رائعة! 🎉');
      } else if (evaluation.accuracy >= 50) {
        toast.info('جيد! استمر في التدرب');
      } else {
        toast.info('حاول مرة أخرى');
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      toast.error('فشل في تقييم القراءة');
    } finally {
      setIsEvaluating(false);
    }
  };

  const reset = () => {
    setResult(null);
    setTranscript('');
  };

  if (!isSupported) {
    return (
      <Card className="p-4 text-center">
        <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          المتصفح لا يدعم التعرف على الصوت. جرب Chrome أو Safari.
        </p>
      </Card>
    );
  }

  if (result) {
    return (
      <Card className="p-4 space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${result.accuracy >= 80 ? 'text-accent' : 'text-muted-foreground'}`} />
            نتيجة القراءة
          </h4>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RefreshCw className="w-4 h-4 ml-1" />
            إعادة المحاولة
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>دقة القراءة</span>
            <span className="font-bold">{result.accuracy}%</span>
          </div>
          <Progress value={result.accuracy} className="h-3" />
        </div>

        <div className="text-sm text-muted-foreground">
          <p>{result.correctWords} من {result.totalWords} كلمة صحيحة</p>
        </div>

        {result.spokenText && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">ما قلته:</p>
            <p className="text-sm">{result.spokenText}</p>
          </div>
        )}

        {result.feedback && (
          <p className="text-sm">{result.feedback}</p>
        )}

        {result.encouragement && (
          <p className="text-sm font-medium text-primary">{result.encouragement}</p>
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {isEvaluating ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">جاري تقييم القراءة...</p>
        </div>
      ) : (
        <>
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className="h-16 w-16 rounded-full"
          >
            {isRecording ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isRecording ? 'اضغط للإيقاف' : 'اضغط للتسجيل والقراءة بصوتك'}
          </p>
          
          {transcript && (
            <div className="w-full p-3 bg-muted/50 rounded-lg text-center">
              <p className="text-xs text-muted-foreground mb-1">جاري التسجيل...</p>
              <p className="text-sm">{transcript}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
