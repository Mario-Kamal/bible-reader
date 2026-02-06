import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

const DISMISS_KEY = 'pwa-install-banner-dismissed';

export function InstallBanner() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    const wasDismissed = localStorage.getItem(DISMISS_KEY);
    // Show again after 3 days
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      const threeDays = 3 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt > threeDays) {
        setDismissed(false);
      }
    } else {
      setDismissed(false);
    }
  }, []);

  if (isInstalled || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleInstall = async () => {
    await install();
  };

  return (
    <Card className="p-4 border-accent/30 bg-accent/5 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-2 left-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="إغلاق"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">ثبّت التطبيق</h3>
          <p className="text-xs text-muted-foreground">للوصول السريع والعمل بدون إنترنت</p>
        </div>
        {isInstallable ? (
          <Button
            onClick={handleInstall}
            size="sm"
            className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
          >
            تثبيت
          </Button>
        ) : (
          <Link to="/install">
            <Button
              size="sm"
              className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
            >
              كيف؟
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
}
