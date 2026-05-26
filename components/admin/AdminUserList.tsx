'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Role } from '@/lib/supabase/types';
import { ROLE_LABELS } from '@/lib/supabase/types';
import { formatBgDate } from '@/lib/utils/date';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ShieldCheck, User, Clock } from 'lucide-react';

interface AdminUserListProps {
  users: Profile[];
  currentUserId: string;
}

const roleColors: Record<Role, string> = {
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  secretary: 'bg-green-50 text-green-700 border-green-200',
  viewer: 'bg-gray-50 text-gray-600 border-gray-200',
};

const roleIcons: Record<Role, React.ReactNode> = {
  admin: <ShieldCheck size={14} />,
  secretary: <User size={14} />,
  viewer: <User size={14} />,
};

export default function AdminUserList({ users, currentUserId }: AdminUserListProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [localUsers, setLocalUsers] = useState<Profile[]>(users);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  async function handleRoleChange(userId: string, newRole: Role) {
    if (userId === currentUserId) return;
    setUpdating(userId);

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast({ title: 'Грешка', description: error.message, variant: 'destructive' });
    } else {
      setLocalUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast({ title: 'Ролята е обновена успешно.' });
    }
    setUpdating(null);
  }

  return (
    <>
      <Toaster />
      <div className="grid gap-3">
        {localUsers.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <Card key={user.id} className={`border-0 shadow-sm transition-all ${isCurrentUser ? 'ring-2 ring-blue-200' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">
                      {(user.full_name || user.email).charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {user.full_name || '(без име)'}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          Вие
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Clock size={11} />
                      <span>Регистриран: {formatBgDate(user.created_at)}</span>
                    </div>
                  </div>

                  {/* Role selector */}
                  <div className="flex-shrink-0">
                    {isCurrentUser ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${roleColors[user.role]}`}>
                        {roleIcons[user.role]}
                        {ROLE_LABELS[user.role]}
                      </span>
                    ) : (
                      <Select
                        value={user.role}
                        onValueChange={(val) => handleRoleChange(user.id, val as Role)}
                        disabled={updating === user.id}
                      >
                        <SelectTrigger className={`w-40 h-9 text-sm font-medium border ${roleColors[user.role]} bg-transparent`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-2">
                              <ShieldCheck size={14} className="text-blue-600" />
                              Администратор
                            </span>
                          </SelectItem>
                          <SelectItem value="secretary">
                            <span className="flex items-center gap-2">
                              <User size={14} className="text-green-600" />
                              Секретар
                            </span>
                          </SelectItem>
                          <SelectItem value="viewer">
                            <span className="flex items-center gap-2">
                              <User size={14} className="text-gray-500" />
                              Читател
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
