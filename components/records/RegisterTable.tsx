'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatBgDate } from '@/lib/utils/date';
import type { RegisterType, Role } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Plus, Search, Pencil, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface RegisterTableProps {
  register: RegisterType;
  title: string;
  data: Record<string, unknown>[];
  columns: Column[];
  userRole: Role;
  totalCount: number;
  page: number;
  pageSize?: number;
  searchValue?: string;
}

export default function RegisterTable({
  register,
  title,
  data,
  columns,
  userRole,
  totalCount,
  page,
  pageSize = 20,
  searchValue = '',
}: RegisterTableProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState(searchValue);

  const canEdit = userRole === 'admin' || userRole === 'secretary';
  const canDelete = userRole === 'admin';
  const totalPages = Math.ceil(totalCount / pageSize);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    params.set('page', '1');
    router.push(`/${register}?${params.toString()}`);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    params.set('page', String(newPage));
    router.push(`/${register}?${params.toString()}`);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    await supabase.from(register).delete().eq('id', deleteId);
    setDeleteId(null);
    setDeleting(false);
    router.refresh();
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} записа общо</p>
        </div>
        {canEdit && (
          <Link href={`/records/${register}/new`}>
            <Button className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
              <Plus size={16} />
              Нов запис
            </Button>
          </Link>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Търсене..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">Търси</Button>
          {searchValue && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setSearch(''); router.push(`/${register}`); }}
            >
              Изчисти
            </Button>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((col) => (
                <TableHead key={col.key} className="font-semibold text-gray-700 text-xs uppercase tracking-wider">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="font-semibold text-gray-700 text-xs uppercase tracking-wider text-right">
                Действия
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="text-center text-gray-400 py-12">
                  Няма намерени записи.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow
                  key={row.id as string}
                  className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                  onClick={() => router.push(`/records/${register}/${row.id}`)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-sm text-gray-700">
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as string) || '—'}
                    </TableCell>
                  ))}
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/records/${register}/${row.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600">
                          <Eye size={15} />
                        </Button>
                      </Link>
                      {canEdit && (
                        <Link href={`/records/${register}/${row.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-green-600">
                            <Pencil size={15} />
                          </Button>
                        </Link>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600"
                          onClick={() => setDeleteId(row.id as string)}
                        >
                          <Trash2 size={15} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Страница {page} от {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft size={16} />
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Напред
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Изтриване на запис</AlertDialogTitle>
            <AlertDialogDescription>
              Сигурни ли сте, че искате да изтриете този запис? Действието е необратимо.
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
