'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatBgDate } from '@/lib/utils/date';
import type { RegisterType, Role } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, Search, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface RegisterTableProps {
  register: RegisterType;
  title: string;
  data: Record<string, unknown>[];
  userRole: Role;
  totalCount: number;
  page: number;
  pageSize?: number;
  searchValue?: string;
}

const registerColumnConfigs: Record<RegisterType, { key: string; label: string }[]> = {
  incoming: [
    { key: 'number', label: '№' },
    { key: 'date', label: 'Дата' },
    { key: 'from_whom', label: 'От кого' },
    { key: 'subject', label: 'Относно' },
    { key: 'file_name', label: 'Файл' },
  ],
  outgoing: [
    { key: 'number', label: '№' },
    { key: 'date', label: 'Дата' },
    { key: 'to_whom', label: 'До кого' },
    { key: 'subject', label: 'Относно' },
    { key: 'file_name', label: 'Файл' },
  ],
  orders: [
    { key: 'number', label: '№' },
    { key: 'date', label: 'Дата' },
    { key: 'title', label: 'Заглавие' },
    { key: 'file_name', label: 'Файл' },
  ],
  contracts: [
    { key: 'number', label: '№' },
    { key: 'date', label: 'Дата' },
    { key: 'counterparty', label: 'Контрагент' },
    { key: 'subject', label: 'Предмет' },
    { key: 'start_date', label: 'От дата' },
    { key: 'end_date', label: 'До дата' },
    { key: 'file_name', label: 'Файл' },
  ],
};

const registerTitles: Record<RegisterType, string> = {
  incoming: 'Регистър-входящи',
  outgoing: 'Регистър-изходящи',
  orders: 'Заповеди',
  contracts: 'Договори',
};

const numberColors: Record<RegisterType, string> = {
  incoming: 'text-blue-700',
  outgoing: 'text-green-700',
  orders: 'text-orange-700',
  contracts: 'text-purple-700',
};

const fileBadgeColors: Record<RegisterType, string> = {
  incoming: 'bg-blue-50 text-blue-700',
  outgoing: 'bg-green-50 text-green-700',
  orders: 'bg-orange-50 text-orange-700',
  contracts: 'bg-purple-50 text-purple-700',
};

function renderCell(register: RegisterType, key: string, value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === '') return <span className="text-gray-300">—</span>;

  if (key === 'number') {
    return <span className={`font-mono font-medium ${numberColors[register]}`}>{String(value)}</span>;
  }

  if (key === 'date' || key === 'start_date' || key === 'end_date') {
    return formatBgDate(value as string);
  }

  if (key === 'file_name') {
    if (value) {
      return (
        <span className={`text-xs px-2 py-1 rounded font-medium ${fileBadgeColors[register]}`}>
          PDF/DOCX
        </span>
      );
    }
    return <span className="text-gray-300">—</span>;
  }

  return String(value);
}

function cellToText(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  if (key === 'date' || key === 'start_date' || key === 'end_date') {
    return formatBgDate(value as string) as string;
  }
  if (key === 'file_name') return value ? 'Да' : '';
  return String(value);
}

export default function RegisterTable({
  register,
  title,
  data,
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
  const [exporting, setExporting] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'secretary';
  const canDelete = userRole === 'admin';
  const totalPages = Math.ceil(totalCount / pageSize);
  const columns = registerColumnConfigs[register];

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

  async function handleExport() {
    setExporting(true);
    try {
      // Зареди всички записи за експорт
      const { data: allData } = await supabase
        .from(register)
        .select('*')
        .order('date', { ascending: false });

      if (!allData || allData.length === 0) {
        setExporting(false);
        return;
      }

      // Заглавен ред
      const headers = columns.map(c => c.label);
      const rows = allData.map(row =>
        columns.map(col => cellToText(col.key, row[col.key]))
      );

      // Построй CSV съдържание с BOM за кирилица
      const BOM = '\uFEFF';
      const csvContent = BOM + [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // Свали файла
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${registerTitles[register]}_${new Date().getFullYear()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} записа общо</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 text-gray-600 border-gray-200 hover:bg-gray-50"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={15} />
            {exporting ? 'Експортиране...' : 'Експорт Excel'}
          </Button>
          {canEdit && (
            <Link href={`/records/${register}/new`}>
              <Button className="bg-blue-700 hover:bg-blue-800 text-white gap-2">
                <Plus size={16} />
                Нов запис
              </Button>
            </Link>
          )}
        </div>
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
                      {renderCell(register, col.key, row[col.key])}
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
