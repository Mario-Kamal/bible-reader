import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const phoneSchema = z.string()
  .min(10, 'رقم الهاتف يجب أن يكون 10 أرقام على الأقل')
  .max(15, 'رقم الهاتف طويل جداً')
  .regex(/^[\d\s\-\+\(\)]+$/, 'رقم هاتف غير صحيح');

const passwordSchema = z.string()
  .min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');

const nameSchema = z.string()
  .min(2, 'الاسم يجب أن يكون حرفين على الأقل')
  .max(100, 'الاسم طويل جداً');

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      phoneSchema.parse(loginPhone);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginPhone, loginPassword);
    setIsLoading(false);

    if (error) {
      console.error('Login error:', error);
      if (error.message.includes('Email not confirmed')) {
        toast.error('يرجى تعطيل "Email Confirmation" في إعدادات Supabase Authentication');
      } else {
        toast.error('رقم الهاتف أو كلمة المرور غير صحيحة');
      }
    } else {
      toast.success('أهلاً بعودتك!');
      navigate('/home');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      nameSchema.parse(signupName.trim());
      phoneSchema.parse(signupPhone);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signUp(signupPhone, signupPassword, signupName.trim());
    setIsLoading(false);

    if (error) {
      console.error('Signup error:', error);
      if (error.message.includes('already registered')) {
        toast.error('رقم الهاتف مسجل مسبقاً');
      } else {
        toast.error(`فشل في إنشاء الحساب: ${error.message}`);
      }
    } else {
      toast.success('تم إنشاء الحساب! أهلاً بك في رحلة الكتاب المقدس!');
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-gold mb-4 shadow-gold">
            <BookOpen className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white">رحلة الكتاب المقدس</h1>
          <p className="text-white/70 mt-2">اقرأ. تعلم. انمُ.</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <Tabs defaultValue="login" className="w-full">
            <CardHeader className="pb-4 pt-6">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">حساب جديد</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">رقم الهاتف</Label>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="أدخل رقم هاتفك"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">كلمة المرور</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="أدخل كلمة المرور"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الدخول...
                      </>
                    ) : (
                      'دخول'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">الاسم الكامل</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="أدخل اسمك الكامل"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">رقم الهاتف</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="أدخل رقم هاتفك"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      required
                      dir="ltr"
                      className="text-left"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">كلمة المرور</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="أنشئ كلمة مرور (6 أحرف على الأقل)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-semibold shadow-md hover:shadow-lg transition-shadow" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      'إنشاء حساب'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
