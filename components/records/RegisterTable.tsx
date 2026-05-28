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
import { Plus, Search, Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react';

interface RegisterTableProps {
  register: RegisterType;
  title: string;
  data: Record<string, unknown>[];
  userRole: Role;
  totalCount: number;
  page: number;
  pageSize?: number;
  searchValue?: string;
  yearValue?: string;
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

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function RegisterTable({
  register,
  title,
  data,
  userRole,
  totalCount,
  page,
  pageSize = 20,
  searchValue = '',
  yearValue = '',
}: RegisterTableProps) {
  const router = useRouter();
  const supabase = createClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState(searchValue);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const canEdit = userRole === 'admin' || userRole === 'secretary';
  const canDelete = userRole === 'admin';
  const totalPages = Math.ceil(totalCount / pageSize);
  const columns = registerColumnConfigs[register];

  function buildParams(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (yearValue) params.set('year', yearValue);
    params.set('page', '1');
    Object.entries(overrides).forEach(([k, v]) => v ? params.set(k, v) : params.delete(k));
    return params.toString();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (yearValue) params.set('year', yearValue);
    params.set('page', '1');
    router.push(`/${register}?${params.toString()}`);
  }

  function handleYearChange(y: string) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (y) params.set('year', y);
    params.set('page', '1');
    router.push(`/${register}?${params.toString()}`);
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (yearValue) params.set('year', yearValue);
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
      let query = supabase.from(register).select('*').order('date', { ascending: true });
      if (yearValue) {
        query = query.gte('date', `${yearValue}-01-01`).lte('date', `${yearValue}-12-31`);
      }
      const { data: allData } = await query;
      if (!allData || allData.length === 0) return;

      const XLSX = await import('xlsx');
      const headers = columns.map(c => c.label);
      const rows = allData.map(row => columns.map(col => cellToText(col.key, row[col.key])));
      const wsData = [headers, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws['!cols'] = columns.map(col => {
        if (col.key === 'number') return { wch: 15 };
        if (col.key === 'date' || col.key === 'start_date' || col.key === 'end_date') return { wch: 12 };
        if (col.key === 'file_name') return { wch: 8 };
        return { wch: 40 };
      });
      const wb = XLSX.utils.book_new();
      const suffix = yearValue ? `_${yearValue}` : `_${currentYear}`;
      XLSX.utils.book_append_sheet(wb, ws, registerTitles[register].substring(0, 31));
      XLSX.writeFile(wb, `${registerTitles[register]}${suffix}.xlsx`);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      let query = supabase.from(register).select('*').order('date', { ascending: true });
      if (yearValue) {
        query = query.gte('date', `${yearValue}-01-01`).lte('date', `${yearValue}-12-31`);
      }
      const { data: allData } = await query;
      if (!allData || allData.length === 0) return;

      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.addFont('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');

      const today = new Date().toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const yearLabel = yearValue || currentYear;

      doc.setFontSize(14);
      doc.text('ЦСОП Варна — Деловодна система', 148, 15, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`${registerTitles[register]} — ${yearLabel} г.`, 148, 22, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Генерирано на: ${today}`, 148, 28, { align: 'center' });
      doc.setTextColor(0);

      const headers = columns.map(c => c.label);
      const rows = allData.map(row => columns.map(col => cellToText(col.key, row[col.key])));

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 32,
        styles: {
          font: 'Roboto',
          fontSize: 9,
          cellPadding: 3,
          overflow: 'linebreak',
          lineColor: [220, 220, 220],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [29, 78, 216],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: columns.reduce((acc, col, i) => {
          if (col.key === 'number') acc[i] = { cellWidth: 22 };
          else if (col.key === 'date' || col.key === 'start_date' || col.key === 'end_date') acc[i] = { cellWidth: 22 };
          else if (col.key === 'file_name') acc[i] = { cellWidth: 12 };
          else acc[i] = { cellWidth: 'auto' };
          return acc;
        }, {} as Record<number, { cellWidth: number | 'auto' }>),
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(150);
          doc.text(
            `Страница ${data.pageNumber} от ${pageCount} — ЦСОП Варна Деловодна система`,
            148,
            doc.internal.pageSize.height - 5,
            { align: 'center' }
          );
          doc.setTextColor(0);
        },
      });

      const suffix = yearValue ? `_${yearValue}` : `_${currentYear}`;
      doc.save(`${registerTitles[register]}${suffix}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} записа общо{yearValue ? ` за ${yearValue} г.` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 text-gray-600 border-gray-200 hover:bg-gray-50"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download size={15} />
            {exporting ? 'Експортиране...' : 'Excel'}
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            onClick={handleExportPdf}
            disabled={exportingPdf}
          >
            <FileText size={15} />
            {exportingPdf ? 'Генериране...' : 'PDF'}
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

      {/* Search + Year filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Търсене..."
              className="pl-9 w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">Търси</Button>
          {searchValue && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setSearch(''); router.push(`/${register}${yearValue ? `?year=${yearValue}` : ''}`); }}
            >
              Изчисти
            </Button>
          )}
        </form>

        {/* Year filter */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleYearChange('')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${!yearValue ? 'bg-blue-700 text-white border-blue-700' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            Всички
          </button>
          {years.map(y => (
            <button
              key={y}
              onClick={() => handleYearChange(String(y))}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${yearValue === String(y) ? 'bg-blue-700 text-white border-blue-700' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

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
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(page - 1)}>
              <ChevronLeft size={16} />
              Назад
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)}>
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
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? 'Изтриване...' : 'Изтрий'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
