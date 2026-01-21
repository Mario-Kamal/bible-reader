import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, Square, Loader2, Trophy, RefreshCw } from 'lucide-react';
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

export function ReadingEvaluator({ expectedText, onComplete }: ReadingEvaluatorProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await evaluateReading(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setResult(null);
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('فشل في بدء التسجيل. تأكد من السماح بالميكروفون.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const evaluateReading = async (audioBlob: Blob) => {
    setIsEvaluating(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('expectedText', expectedText);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-reading`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
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
  };

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
        </>
      )}
    </div>
  );
}
