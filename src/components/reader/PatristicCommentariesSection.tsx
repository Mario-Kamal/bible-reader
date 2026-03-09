import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, Quote } from 'lucide-react';
import { PatristicCommentary } from '@/hooks/usePatristicCommentaries';

interface PatristicCommentariesSectionProps {
  commentaries: PatristicCommentary[];
}

export function PatristicCommentariesSection({ commentaries }: PatristicCommentariesSectionProps) {
  if (commentaries.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        تفسيرات الآباء
      </h3>
      
      <div className="space-y-4">
        {commentaries.map((commentary, index) => (
          <Card 
            key={commentary.id}
            className="p-5 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Saint Info Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                ✝
              </div>
              <div>
                <h4 className="font-semibold text-primary">
                  {commentary.saint_title && `${commentary.saint_title} `}
                  {commentary.saint_name}
                </h4>
                {commentary.source && (
                  <p className="text-xs text-muted-foreground">{commentary.source}</p>
                )}
              </div>
            </div>

            {/* Commentary Text */}
            <div className="relative pr-6">
              <Quote className="absolute right-0 top-0 w-4 h-4 text-primary/30" />
              <p className="text-muted-foreground leading-relaxed text-sm">
                {commentary.commentary_text}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
