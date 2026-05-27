import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import type { RegisterType } from '@/lib/supabase/types';
import { REGISTER_LABELS } from '@/lib/supabase/types';
import { formatBgDate } from '@/lib/utils/date';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Download, Pencil, FileText, Calendar, Hash } from 'lucide-react';
import DeleteButton from '@/components/records/DeleteButton';

const VALID_REGISTERS: RegisterType[] = ['incoming', 'outgoing', 'orders', 'contracts'];

const registerAccentColors: Record<RegisterType, string> = {
  incoming: 'bg-blue-50 border-blue-200 text-blue-700',
  outgoing: 'bg-green-50 border-green-200 text-green-700',
  orders: 'bg-orange-50 border-orange-200 text-orange-700',
  contracts: 'bg-purple-50 border-purple-200 text-purple-700',
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  leave_paid: 'Отпуск — платен',
  leave_unpaid: 'Отпуск — неплатен',
  leave_sick: 'Отпуск — болничен',
  leave_maternity: 'Отпуск — майчинство',
  mission: 'Командировка',
  duty: 'Дежурство',
  hire: 'Назначаване',
  dismiss: 'Освобождаване',
  education: 'Учебна дейност',
  other: 'Друга',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  delivery: 'Доставка',
  service: 'Услуга',
  rent: 'Наем',
  labor: 'Трудов',
  civil: 'Граждански',
  other: 'Друг',
};

const CONTRACT_STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  in_progress: 'В изпълнение',
  expired: 'Изтекъл',
  terminated: 'Прекратен',
};

const RESOLUTION_LABELS: Record<string, string> = {
  director: 'Директор (Светлана Иванова)',
  zdasd: 'ЗДАСД (Йордан Йорданов)',
  zdud: 'ЗДУД (Силвия Кьошкерян)',
  accounting: 'Счетоводство (Радка Георгиева)',
  specialists: 'Специалисти',
};

export default async function RecordViewPage({
  params,
}: {
  params: Promise<{ register: string; id: string }>;
}) {
  const { register, id } = await params;

  if (!VALID_REGISTERS.includes(register as RegisterType)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!profile) redirect('/login');

  const { data: record } = await supabase
    .from(register as RegisterType)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!record) notFound();

  const { data: creator } = record.created_by
    ? await supabase.from('profiles').select('full_name, email').eq('id', record.created_by).maybeSingle()
    : { data: null };

  const canEdit = profile.role === 'admin' || profile.role === 'secretary';
  const canDelete = profile.role === 'admin';
  const reg = register as RegisterType;
  const accentClass = registerAccentColors[reg];

  const r: Record<string, string> = record as Record<string, string>;

  const fields: { label: string; value: string | null | undefined }[] = [];

  if (reg === 'incoming') {
    fields.push({ label: 'От кого', value: r.from_whom });
    fields.push({ label: 'Относно', value: r.subject });
    if (r.resolution) fields.push({ label: 'Резолюция', value: RESOLUTION_LABELS[r.resolution] || r.resolution });
  }

  if (reg === 'outgoing') {
    fields.push({ label: 'До кого', value: r.to_whom });
    fields.push({ label: 'Относно', value: r.subject });
    if (r.resolution) fields.push({ label: 'Резолюция', value: RESOLUTION_LABELS[r.resolution] || r.resolution });
  }

  if (reg === 'orders') {
    fields.push({ label: 'Заглавие', value: r.title });
    if (r.order_type) fields.push({ label: 'Вид заповед', value: ORDER_TYPE_LABELS[r.order_type] || r.order_type });
    if (r.employee) fields.push({ label: 'Служител', value: r.employee });
    if (r.destination) fields.push({ label: 'Дестинация / Място', value: r.destination });
    if (r.from_date) fields.push({ label: 'От дата', value: formatBgDate(r.from_date) });
    if (r.to_date) fields.push({ label: 'До дата', value: formatBgDate(r.to_date) });
    if (r.days) fields.push({ label: 'Брой дни', value: r.days });
  }

  if (reg === 'contracts') {
    if (r.contract_type) fields.push({ label: 'Вид договор', value: CONTRACT_TYPE_LABELS[r.contract_type] || r.contract_type });
    fields.push({ label: 'Контрагент', value: r.counterparty });
    if (r.subject) fields.push({ label: 'Предмет на договора', value: r.subject });
    if (r.start_date) fields.push({ label: 'Начална дата', value: formatBgDate(r.start_date) });
    if (r.end_date) fields.push({ label: 'Крайна дата', value: formatBgDate(r.end_date) });
    if (r.value) fields.push({ label: 'Стойност', value: `${Number(r.value).toFixed(2)} лв.` });
    if (r.responsible_person) fields.push({ label: 'Отговорно лице', value: r.responsible_person });
    if (r.status) fields.push({ label: 'Статус', value: CONTRACT_STATUS_LABELS[r.status] || r.status });
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/${register}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft size={16} />
          Назад към {REGISTER_LABELS[reg]}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${accentClass}`}>
                {REGISTER_LABELS[reg]}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {reg === 'orders' ? r.title : r.subject || `Запис №${r.number}`}
            </h1>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {canEdit && (
              <Link href={`/records/${register}/${id}/edit`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Pencil size={14} />
                  Редактирай
                </Button>
              </Link>
            )}
            {canDelete && (
              <DeleteButton id={id} register={reg} redirectTo={`/${register}`} />
            )}
          </div>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Hash size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Регистрационен номер</p>
                <p className="text-lg font-bold text-gray-900 font-mono">{r.number}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-0.5">Дата</p>
                <p className="text-lg font-semibold text-gray-900">{formatBgDate(r.date)}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-4">
            {fields.map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">{label}</p>
                <p className="text-gray-800">{value || '—'}</p>
              </div>
            ))}

            {r.description && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">
                  {reg === 'contracts' ? 'Бележки' : 'Описание'}
                </p>
                <p className="text-gray-800 whitespace-pre-wrap">{r.description}</p>
              </div>
            )}
          </div>

          {r.file_url && r.file_name && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-3">Прикачен файл</p>
              <a
                href={r.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download={r.file_name}
                className="inline-flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FileText size={18} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-700 font-medium truncate max-w-xs">{r.file_name}</span>
                <Download size={16} className="text-blue-500 flex-shrink-0 ml-auto" />
              </a>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
            <p>
              Създаден от: {creator?.full_name || creator?.email || 'Неизвестен'} •{' '}
              {formatBgDate(r.created_at)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
