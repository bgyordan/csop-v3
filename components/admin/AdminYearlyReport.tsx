'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, Send, FileText, ScrollText, Download } from 'lucide-react';
import { formatBgDate } from '@/lib/utils/date';

const registers = [
  { key: 'incoming', label: 'Регистър-входящи', icon: Inbox, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { key: 'outgoing', label: 'Регистър-изходящи', icon: Send, color: 'text-green-600 bg-green-50 border-green-200' },
  { key: 'orders', label: 'Заповеди', icon: FileText, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { key: 'contracts', label: 'Договори', icon: ScrollText, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

const columnConfigs: Record<string, { key: string; label: string }[]> = {
  incoming: [
    { key: 'number', label: '№' },
    { key: 'date', label: 'Дата' },
    { key: 'from_whom', label: 'От кого' },
    { key: 'subject', label: 'Относно' },
    { key: 'nomenclature_code', label: 'Номенкл.' },
    { key: 'status', label: 'Статус' },
  ],
  outgoing: [
    { key: 'number', label: '№' },
    { key: 'date', label: 'Дата' },
    { key: 'to_whom', label: 'До кого' },
    { key: 'subject', label: 'Относно' },
    { key: 'nomenclature_code', label: 'Номенкл.' },
    { key: 'status', label: 'Статус' },
  ],
  orders: [
    { key: 'number', label: '№' },
    { key: 'date', label: 'Дата' },
    { key: 'order_type_code', label: 'Вид' },
    { key: 'title', label: 'Заглавие' },
    { key: 'status', label: 'Статус' },
  ],
  contracts: [
    { key: 'number', label: '№' },
    { key: 'date', label: 'Дата' },
    { key: 'counterparty', label: 'Контрагент' },
    { key: 'subject', label: 'Предмет' },
    { key: 'end_date', label: 'До дата' },
    { key: 'status', label: 'Статус' },
  ],
};

function cellText(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (key === 'date' || key === 'end_date' || key === 'start_date') return formatBgDate(value as string) as string;
  if (key === 'status') {
    if (value === 'cancelled') return 'АНУЛИРАН';
    if (value === 'active') return 'Активен';
    return String(value);
  }
  return String(value);
}

export default function AdminYearlyReport() {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [generating, setGenerating] = useState<string | null>(null);
  const supabase = createClient();

  async function generatePdf(register: string, label: string) {
    setGenerating(register);
    try {
      const { data } = await supabase
        .from(register)
        .select('*')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`)
        .order('date', { ascending: true });

      if (!data || data.length === 0) {
        alert(`Няма записи за ${selectedYear} г.`);
        return;
      }

      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      doc.addFont('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', 'Roboto', 'normal');
      doc.setFont('Roboto');

      const today = new Date().toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const totalRecords = data.length;
      const cancelledRecords = data.filter((r: Record<string, unknown>) => r.status === 'cancelled').length;

      // Хедър
      doc.setFontSize(16);
      doc.text('ЦСОП Варна — Деловодна система', 148, 14, { align: 'center' });
      doc.setFontSize(13);
      doc.text(`ПРИКЛЮЧЕН ДЕЛОВОДЕН ДНЕВНИК`, 148, 21, { align: 'center' });
      doc.setFontSize(11);
      doc.text(`${label} — ${selectedYear} г.`, 148, 28, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Общо записи: ${totalRecords} | Анулирани: ${cancelledRecords} | Активни: ${totalRecords - cancelledRecords}`, 148, 34, { align: 'center' });
      doc.text(`Генериран на: ${today}`, 148, 39, { align: 'center' });
      doc.setTextColor(0);

      const columns = columnConfigs[register];
      const headers = columns.map(c => c.label);
      const rows = data.map((row: Record<string, unknown>) =>
        columns.map(col => cellText(col.key, row[col.key]))
      );

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 43,
        styles: {
          font: 'Roboto',
          fontSize: 8,
          cellPadding: 2.5,
          overflow: 'linebreak',
          lineColor: [200, 200, 200],
          lineWidth: 0.3,
        },
        headStyles: {
          fillColor: [30, 64, 175],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        bodyStyles: {
          textColor: [30, 30, 30],
        },
        didParseCell: (data) => {
          // Анулираните редове с червен текст
          const row = data.row.raw as string[];
          if (row && row.includes('АНУЛИРАН')) {
            data.cell.styles.textColor = [180, 30, 30];
            data.cell.styles.fontStyle = 'italic';
          }
        },
        columnStyles: columns.reduce((acc, col, i) => {
          if (col.key === 'number') acc[i] = { cellWidth: 30 };
          else if (col.key === 'date' || col.key === 'end_date') acc[i] = { cellWidth: 22 };
          else if (col.key === 'nomenclature_code' || col.key === 'order_type_code') acc[i] = { cellWidth: 16 };
          else if (col.key === 'status') acc[i] = { cellWidth: 18 };
          else acc[i] = { cellWidth: 'auto' };
          return acc;
        }, {} as Record<number, { cellWidth: number | 'auto' }>),
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(120);
          doc.text(
            `Страница ${data.pageNumber} от ${pageCount} — ЦСОП Варна | ${label} ${selectedYear} г. | Приключен деловоден дневник`,
            148,
            doc.internal.pageSize.height - 5,
            { align: 'center' }
          );
          doc.setTextColor(0);
        },
      });

      // Подпис секция
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 200;
      if (finalY + 40 < doc.internal.pageSize.height) {
        doc.setFontSize(9);
        doc.setTextColor(50);
        doc.text('Дневникът е приключен на: ___________________', 30, finalY + 15);
        doc.text('Директор: _________________________________', 30, finalY + 25);
        doc.text('(подпис и печат)', 30, finalY + 32);
      }

      doc.save(`Дневник_${label}_${selectedYear}.pdf`);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Избор на година */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">Изберете година</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${selectedYear === y ? 'bg-blue-700 text-white border-blue-700' : 'text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Генериране по регистър */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {registers.map(({ key, label, icon: Icon, color }) => (
          <Card key={key} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{label}</p>
                  <p className="text-xs text-gray-400">{selectedYear} г.</p>
                </div>
              </div>
              <Button
                onClick={() => generatePdf(key, label)}
                disabled={generating === key}
                variant="outline"
                className="w-full gap-2 text-gray-700"
              >
                <Download size={15} />
                {generating === key ? 'Генериране...' : 'Генерирай PDF дневник'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Дневникът включва всички записи за избраната година — активни и анулирани. Анулираните са отбелязани в червено.
      </p>
    </div>
  );
}
