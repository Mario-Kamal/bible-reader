import { useState, useEffect } from 'react';
import { Sun, Moon, Type, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

const FONT_SIZE_KEY = 'reader-font-size';
const THEME_KEY = 'reader-theme';

export type ReaderTheme = 'light' | 'dark' | 'sepia';

export function useReaderSettings() {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(FONT_SIZE_KEY);
    return saved ? parseInt(saved) : 16;
  });

  const [theme, setTheme] = useState<ReaderTheme>(() => {
    return (localStorage.getItem(THEME_KEY) as ReaderTheme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return { fontSize, setFontSize, theme, setTheme };
}

interface ReaderSettingsButtonProps {
  fontSize: number;
  setFontSize: (size: number) => void;
  theme: ReaderTheme;
  setTheme: (theme: ReaderTheme) => void;
}

export function ReaderSettingsButton({ fontSize, setFontSize, theme, setTheme }: ReaderSettingsButtonProps) {
  const themes: { value: ReaderTheme; label: string; icon: React.ReactNode; className: string }[] = [
    { value: 'light', label: 'فاتح', icon: <Sun className="w-4 h-4" />, className: 'bg-background text-foreground border-border' },
    { value: 'sepia', label: 'دافئ', icon: <Sun className="w-4 h-4" />, className: 'bg-[#f4ecd8] text-[#5b4636] border-[#d4c5a9]' },
    { value: 'dark', label: 'داكن', icon: <Moon className="w-4 h-4" />, className: 'bg-[#1a1a2e] text-[#e0e0e0] border-[#333]' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="w-9 h-9">
          <Type className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end" dir="rtl">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-3">حجم الخط</p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8"
                onClick={() => setFontSize(Math.max(12, fontSize - 2))}
              >
                <Minus className="w-3 h-3" />
              </Button>
              <Slider
                value={[fontSize]}
                onValueChange={([v]) => setFontSize(v)}
                min={12}
                max={28}
                step={2}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8"
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              >
                <Plus className="w-3 h-3" />
              </Button>
              <span className="text-sm text-muted-foreground w-8 text-center">{fontSize}</span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-3">وضع القراءة</p>
            <div className="flex gap-2">
              {themes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${t.className} ${
                    theme === t.value ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                >
                  {t.icon}
                  <span className="text-xs">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function getReaderThemeClasses(theme: ReaderTheme): string {
  switch (theme) {
    case 'sepia':
      return 'bg-[#f4ecd8] text-[#5b4636]';
    case 'dark':
      return 'bg-[#1a1a2e] text-[#e0e0e0]';
    default:
      return '';
  }
}
