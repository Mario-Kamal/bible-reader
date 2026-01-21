import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminHeader() {
  const navigate = useNavigate();
  
  return (
    <header className="bg-gradient-hero text-primary-foreground px-4 pt-8 pb-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/home')} 
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowRight className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-display">لوحة التحكم</h1>
            <p className="text-primary-foreground/80 text-sm">إدارة المحتوى والمستخدمين</p>
          </div>
        </div>
      </div>
    </header>
  );
}
