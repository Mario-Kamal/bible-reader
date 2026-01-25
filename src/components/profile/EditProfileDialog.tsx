import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url?: string | null;
  } | null;
  onSuccess: () => void;
}

export function EditProfileDialog({ open, onOpenChange, profile, onSuccess }: EditProfileDialogProps) {
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة صالحة');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 2 ميجابايت');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;

      // Upload to avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast.success('تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('فشل في رفع الصورة');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !fullName.trim()) {
      toast.error('يرجى إدخال الاسم');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName.trim(),
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('تم تحديث الملف الشخصي');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error('فشل في التحديث');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir="rtl">
        <DialogHeader>
          <DialogTitle>تعديل الملف الشخصي</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="bg-primary/10">
                  <User className="w-10 h-10 text-primary" />
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">اضغط لتغيير الصورة</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="fullName">الاسم الكامل</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="أدخل اسمك"
            />
          </div>

          {/* Phone (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              value={profile?.phone || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">لا يمكن تغيير رقم الهاتف</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !fullName.trim()}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'حفظ'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
