import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Smartphone, Wifi, WifiOff, BookOpen, ChevronLeft, Check } from 'lucide-react';

export default function Install() {
  const navigate = useNavigate();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero" dir="rtl">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 pt-8 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
            <span className="text-sm">رجوع</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 px-4 pb-8 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          {/* App Icon */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center mb-6 shadow-gold">
            <BookOpen className="w-12 h-12 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-primary-foreground mb-2 text-center">
            ثبّت التطبيق على جهازك
          </h1>
          <p className="text-primary-foreground/70 text-center mb-8">
            استمتع بتجربة أفضل مع إمكانية العمل بدون إنترنت
          </p>

          {/* Features */}
          <div className="w-full space-y-3 mb-8">
            {[
              {
                icon: Smartphone,
                title: 'يعمل كتطبيق حقيقي',
                desc: 'افتحه من شاشتك الرئيسية مباشرة',
              },
              {
                icon: WifiOff,
                title: 'يعمل بدون إنترنت',
                desc: 'اقرأ المواضيع المحفوظة في أي وقت',
              },
              {
                icon: Download,
                title: 'لا يحتاج مساحة كبيرة',
                desc: 'أخف بكثير من التطبيقات العادية',
              },
            ].map((feature) => (
              <Card key={feature.title} className="p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Install Action */}
          {isInstalled ? (
            <Card className="w-full p-6 text-center border-success/30 bg-success/5">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Check className="w-6 h-6 text-success" />
                <h3 className="text-lg font-bold text-success">التطبيق مثبّت بالفعل! ✅</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                يمكنك فتحه من الشاشة الرئيسية لجهازك
              </p>
            </Card>
          ) : isInstallable ? (
            <Button
              onClick={handleInstall}
              size="lg"
              className="w-full bg-gradient-to-r from-accent to-amber-500 text-primary hover:opacity-90 shadow-gold text-lg h-14"
            >
              <Download className="w-5 h-5 ml-2" />
              تثبيت التطبيق الآن
            </Button>
          ) : (
            <Card className="w-full p-6">
              <h3 className="font-semibold text-foreground mb-3 text-center">
                كيفية التثبيت
              </h3>
              {isIOS ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                    <p>اضغط على زر المشاركة <span className="inline-block">⬆️</span> في أسفل المتصفح</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                    <p>مرر للأسفل واضغط على "إضافة إلى الشاشة الرئيسية"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                    <p>اضغط "إضافة" في الأعلى</p>
                  </div>
                </div>
              ) : isAndroid ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                    <p>اضغط على قائمة المتصفح <span className="font-bold">⋮</span> في الأعلى</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                    <p>اضغط على "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية"</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">3</span>
                    <p>اضغط "تثبيت" للتأكيد</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">1</span>
                    <p>ابحث عن أيقونة التثبيت في شريط العنوان</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">2</span>
                    <p>أو اضغط على قائمة المتصفح واختر "تثبيت التطبيق"</p>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
