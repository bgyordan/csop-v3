'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RegisterType, Role } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Trash2, Ban } from 'lucide-react';

interface RecordActionsProps {
  id: string;
  register: RegisterType;
  recordNumber: string;
  redirectTo: string;
  userRole: Role;
  userId: string;
  userEmail: string;
  currentStatus?: string;
}

export default function RecordActions({
  id,
  register,
  recordNumber,
  redirectTo,
  userRole,
  userId,
  userEmail,
  currentStatus = 'active',
}: RecordActionsProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isAdmin = userRole === 'admin';
  const isCancelled = currentStatus === 'cancelled';

  async function logAction(action: string, details: string) {
    await supabase.from('audit_log').insert({
      user_id: userId,
      user_email: userEmail,
      action,
      register,
      record_id: id,
      record_number: recordNumber,
      details,
    });
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return;
    setCancelling(true);

    await supabase
      .from(register)
      .update({ status: 'cancelled', cancel_reason: cancelReason })
      .eq('id', id);

    await logAction('cancel', `Анулиран. Причина: ${cancelReason}`);

    setCancelOpen(false);
    router.refresh();
    setCancelling(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await logAction('delete', `Изтрит от администратор.`);
    await supabase.from(register).delete().eq('id', id);
    router.push(redirectTo);
    router.refresh();
  }

  async function handleRestore() {
    await supabase
      .from(register)
      .update({ status: 'active', cancel_reason: null })
      .eq('id', id);

    await logAction('restore', `Възстановен от анулиране.`);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {/* Анулирай / Възстанови */}
      {isCancelled ? (
        isAdmin && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50"
            onClick={handleRestore}
          >
            Възстанови
          </Button>
        )
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
          onClick={() => setCancelOpen(true)}
        >
          <Ban size={14} />
          Анулирай
        </Button>
      )}

      {/* Изтрий — само Admin */}
      {isAdmin && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 size={14} />
          Изтрий
        </Button>
      )}

      {/* Диалог Анулиране */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Анулиране на запис № {recordNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Записът ще бъде маркиран като анулиран. Номерът се запазва и не може да се преизползва.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 py-2">
            <Label htmlFor="cancel_reason" className="mb-1.5 block">Причина за анулиране *</Label>
            <Input
              id="cancel_reason"
              placeholder="Въведете причина..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason('')}>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling || !cancelReason.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {cancelling ? 'Анулиране...' : 'Анулирай'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Диалог Изтриване */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на запис № {recordNumber}</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие е необратимо. Записът ще бъде изтрит завинаги.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Изтриване...' : 'Изтрий'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
