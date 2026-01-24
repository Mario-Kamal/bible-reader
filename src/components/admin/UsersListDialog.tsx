import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trophy, Calendar } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  phone: string;
  total_points: number;
  topics_completed: number;
  created_at: string;
}

interface UsersListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  title: string;
  description?: string;
}

export function UsersListDialog({ open, onOpenChange, users, title, description }: UsersListDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {title}
            <Badge variant="secondary">{users.length}</Badge>
          </DialogTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </DialogHeader>
        
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            لا يوجد مستخدمين
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-center">النقاط</TableHead>
                <TableHead className="text-center">المواضيع</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.phone}</TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1 text-accent">
                      <Trophy className="w-3 h-3" />
                      {user.total_points}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{user.topics_completed}</TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(user.created_at), 'd MMM yyyy', { locale: ar })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
