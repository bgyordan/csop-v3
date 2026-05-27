'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RegisterType, Role } from '@/lib/supabase/types';
import { REGISTER_LABELS } from '@/lib/supabase/types';
import { getCurrentYear } from '@/lib/utils/date';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, X, FileText, CircleAlert as AlertCircle } from 'lucide-react';
import Link from 'next/link';

type OrderType = 'leave_paid' | 'leave_unpaid' | 'leave_sick' | 'leave_maternity' | 'mission' | 'duty' | 'hire' | 'dismiss' | 'education' | 'other';
type ContractType = 'delivery' | 'service' | 'rent' | 'labor' | 'civil' | 'other';
type ContractStatus = 'active' | 'in_progress' | 'expired' | 'terminated';

const ORDER_TYPES: { value: OrderType | ''; label: string }[] = [
  { value: '', label: 'Изберете вид...' },
  { value: 'leave_paid', label: 'Отпуск — платен' },
  { value: 'leave_unpaid', label: 'Отпуск — неплатен' },
  { value: 'leave_sick', label: 'Отпуск — болничен' },
  { value: 'leave_maternity', label: 'Отпуск — майчинство' },
  { value: 'mission', label: 'Командировка' },
  { value: 'duty', label: 'Дежурство' },
  { value: 'hire', label: 'Назначаване' },
  { value: 'dismiss', label: 'Освобождаване' },
  { value: 'education', label: 'Учебна дейност' },
  { value: 'other', label: 'Друга' },
];

const CONTRACT_TYPES: { value: ContractType | ''; label: string }[] = [
  { value: '', label: 'Изберете вид...' },
  { value: 'delivery', label: 'Доставка' },
  { value: 'service', label: 'Услуга' },
  { value: 'rent', label: 'Наем' },
  { value: 'labor', label: 'Трудов' },
  { value: 'civil', label: 'Граждански' },
  { value: 'other', label: 'Друг' },
];

const CONTRACT_STATUSES: { value: ContractStatus; label: string }[] = [
  { value: 'active', label: 'Активен' },
  { value: 'in_progress', label: 'В изпълнение' },
  { value: 'expired', label: 'Изтекъл' },
  { value: 'terminated', label: 'Прекратен' },
];

const RESPONSIBLE_PERSONS = [
  'Светлана Иванова (Директор)',
  'Йордан Йорданов (ЗДАСД)',
  'Силвия Кьошкерян (ЗДУД)',
  'Радка Георгиева (Счетоводство)',
  'Друго лице',
];

const ASSIGNEES = [
  { value: '', label: 'Изберете отговорник...' },
  { value: 'Светлана Иванова', label: 'Светлана Иванова (Директор)' },
  { value: 'Йордан Йорданов', label: 'Йордан Йорданов (ЗДАСД)' },
  { value: 'Силвия Кьошкерян', label: 'Силвия Кьошкерян (ЗДУД)' },
  { value: 'Радка Георгиева', label: 'Радка Георгиева (Счетоводство)' },
];

const RESOLUTIONS = [
  { value: '', label: 'Изберете резолюция...' },
  { value: 'director', label: 'Директор (Светлана Иванова)' },
  { value: 'zdasd', label: 'ЗДАСД (Йордан Йорданов)' },
  { value: 'zdud', label: 'ЗДУД (Силвия Кьошкерян)' },
  { value: 'accounting', label: 'Счетоводство (Радка Георгиева)' },
  { value: 'specialists', label: 'Специалисти' },
];

const isLeave = (type: string) => type.startsWith('leave');
const isMission = (type: string) => type === 'mission' || type === 'duty';

interface OrderTypeItem {
  id: string;
  code: string;
  name: string;
}

interface RecordFormProps {
  register: RegisterType;
  initialData?: Record<string, string>;
  nextNumber?: string;
  userId: string;
  mode: 'create' | 'edit';
  orderTypes?: OrderTypeItem[];
}

export default function RecordForm({ register, initialData, nextNumber, userId, mode, orderTypes = [] }: RecordFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);

  const [number, setNumber] = useState<string>(
    isEdit ? (initialData?.number || '') : (nextNumber || `1/${getCurrentYear()}`)
  );
  const [date] = useState<string>(isEdit ? (initialData?.date || today) : today);

  // Incoming/Outgoing
  const [fromWhom, setFromWhom] = useState(isEdit ? (initialData?.from_whom || '') : '');
  const [toWhom, setToWhom] = useState(isEdit ? (initialData?.to_whom || '') : '');
  const [replyTo, setReplyTo] = useState(isEdit ? (initialData?.reply_to || '') : '');
  const [sendMethod, setSendMethod] = useState(isEdit ? (initialData?.send_method || '') : '');
  const [subject, setSubject] = useState(isEdit ? (initialData?.subject || '') : '');
  const [resolution, setResolution] = useState(isEdit ? (initialData?.resolution || '') : '');
  const [description, setDescription] = useState(isEdit ? (initialData?.description || '') : '');
  const [docDate, setDocDate] = useState(isEdit ? (initialData?.doc_date || '') : '');
  const [deadline, setDeadline] = useState(isEdit ? (initialData?.deadline || '') : '');
  const [assignee, setAssignee] = useState(isEdit ? (initialData?.assignee || '') : '');

  // Orders
  const [title, setTitle] = useState(isEdit ? (initialData?.title || '') : '');
  const [orderTypeCode, setOrderTypeCode] = useState(isEdit ? (initialData?.order_type_code || '') : '');
  const [generatingNumber, setGeneratingNumber] = useState(false);
  const [orderType, setOrderType] = useState<OrderType | ''>(isEdit ? (initialData?.order_type || '') as OrderType : '');
  const [employee, setEmployee] = useState(isEdit ? (initialData?.employee || '') : '');
  const [destination, setDestination] = useState(isEdit ? (initialData?.destination || '') : '');
  const [fromDate, setFromDate] = useState(isEdit ? (initialData?.from_date || '') : '');
  const [toDate, setToDate] = useState(isEdit ? (initialData?.to_date || '') : '');
  const [days, setDays] = useState(isEdit ? (initialData?.days || '') : '');

  // Contracts
  const [counterparty, setCounterparty] = useState(isEdit ? (initialData?.counterparty || '') : '');
  const [contractType, setContractType] = useState<ContractType | ''>(isEdit ? (initialData?.contract_type || '') as ContractType : '');
  const [startDate, setStartDate] = useState(isEdit ? (initialData?.start_date || '') : today);
  const [endDate, setEndDate] = useState(isEdit ? (initialData?.end_date || '') : '');
  const [contractValue, setContractValue] = useState(isEdit ? (initialData?.value || '') : '');
  const [responsiblePerson, setResponsiblePerson] = useState(isEdit ? (initialData?.responsible_person || '') : '');
  const [customResponsible, setCustomResponsible] = useState('');
  const [showCustomResponsible, setShowCustomResponsible] = useState(false);
  const [contractStatus, setContractStatus] = useState<ContractStatus>(isEdit ? (initialData?.status || 'active') as ContractStatus : 'active');

  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState(isEdit ? (initialData?.file_name || '') : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateOrderNumber = async (code: string) => {
    if (!code) return;
    setGeneratingNumber(true);
    const currentYear = new Date().getFullYear();
    const { data, error } = await supabase.rpc('get_next_order_number', {
      order_code: code,
      current_year: currentYear,
    });
    if (!error && data) {
      setNumber(data);
    }
    setGeneratingNumber(false);
  };

  const calcDays = (from: string, to: string) => {
    if (from && to) {
      const diff = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) setDays(String(diff));
    }
  };

  const daysUntilExpiry = endDate ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;
  const expiryColor = daysUntilExpiry === null ? '' : daysUntilExpiry < 0 ? 'text-red-600' : daysUntilExpiry < 30 ? 'text-amber-600' : 'text-teal-600';
  const expiryText = daysUntilExpiry === null ? '' : daysUntilExpiry < 0 ? `Изтекъл преди ${Math.abs(daysUntilExpiry)} дни!` : daysUntilExpiry === 0 ? 'Изтича днес!' : daysUntilExpiry < 30 ? `Изтича след ${daysUntilExpiry} дни` : `${daysUntilExpiry} дни остават`;

  const handleResponsibleChange = (value: string) => {
    if (value === 'Друго лице') {
      setShowCustomResponsible(true);
      setResponsiblePerson('');
    } else {
      setShowCustomResponsible(false);
      setResponsiblePerson(value);
      setCustomResponsible('');
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (register === 'contracts' && startDate && endDate && endDate < startDate) {
      setError('Крайната дата не може да е преди началната дата!');
      setLoading(false);
      return;
    }

    if (register === 'orders' && fromDate && toDate && toDate < fromDate) {
      setError('Крайната дата не може да е преди началната дата!');
      setLoading(false);
      return;
    }

    let fileUrl = isEdit ? (initialData?.file_url || '') : '';
    let fileName = isEdit ? (initialData?.file_name || '') : '';

    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Файлът е твърде голям. Максималният размер е 10MB.');
        setLoading(false);
        return;
      }
      const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!allowed.includes(file.type)) {
        setError('Разрешени са само PDF и Word (.docx) файлове.');
        setLoading(false);
        return;
      }

      const ext = file.name.split('.').pop();
      const filePath = `${register}/${Date.now()}_${number.replace('/', '-')}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError(`Грешка при качване на файл: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
      fileName = file.name;
    }

    const payload: Record<string, unknown> = {
      number,
      date,
      description,
      file_url: fileUrl,
      file_name: fileName,
      assignee,
    };

    if (register === 'incoming') {
      payload.from_whom = fromWhom;
      payload.subject = subject;
      payload.resolution = resolution;
      payload.doc_date = docDate || null;
      payload.deadline = deadline || null;
    }

    if (register === 'outgoing') {
      payload.to_whom = toWhom;
      payload.subject = subject;
      payload.reply_to = replyTo;
      payload.send_method = sendMethod;
      payload.doc_date = docDate || null;
    }

    if (register === 'orders') {
      payload.title = title;
      payload.order_type = orderType;
      payload.order_type_code = orderTypeCode;
      payload.employee = employee;
      payload.destination = destination;
      payload.from_date = fromDate || null;
      payload.to_date = toDate || null;
      payload.days = days ? parseInt(days) : null;
    }

    if (register === 'contracts') {
      payload.counterparty = counterparty;
      payload.subject = subject;
      payload.contract_type = contractType;
      payload.start_date = startDate || null;
      payload.end_date = endDate || null;
      payload.value = contractValue ? parseFloat(contractValue) : null;
      payload.responsible_person = showCustomResponsible ? customResponsible : responsiblePerson;
      payload.status = contractStatus;
    }

    if (!isEdit) {
      payload.created_by = userId;
    }

    let dbError;
    if (isEdit) {
      const { error } = await supabase.from(register).update(payload).eq('id', initialData?.id || '');
      dbError = error;
    } else {
      const { error } = await supabase.from(register).insert(payload);
      dbError = error;
    }

    if (dbError) {
      setError(`Грешка: ${dbError.message}`);
      setLoading(false);
      return;
    }

    router.push(`/${register}`);
    router.refresh();
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href={`/${register}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4">
          <ArrowLeft size={16} />
          Назад към {REGISTER_LABELS[register]}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Редактиране на запис' : 'Нов запис'} — {REGISTER_LABELS[register]}
        </h1>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Номер и дата на завеждане */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="number">Регистрационен номер *</Label>
                <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="1/2026" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Дата на завеждане</Label>
                <Input id="date" type="date" value={date} readOnly className="bg-gray-50 cursor-not-allowed" />
              </div>
            </div>

            {/* ВХОДЯЩА ПОЩА */}
            {register === 'incoming' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="from_whom">От кого *</Label>
                  <Input id="from_whom" value={fromWhom} onChange={(e) => setFromWhom(e.target.value)} placeholder="Институция / лице" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Относно *</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Тема на документа" required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="doc_date">Дата на документа — незадължително</Label>
                    <Input id="doc_date" type="date" value={docDate} onChange={(e) => setDocDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="deadline">Срок за отговор — незадължително</Label>
                    <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="resolution">Резолюция</Label>
                  <select id="resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {RESOLUTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* ИЗХОДЯЩА ПОЩА */}
            {register === 'outgoing' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="to_whom">До кого *</Label>
                  <Input id="to_whom" value={toWhom} onChange={(e) => setToWhom(e.target.value)} placeholder="Институция / лице" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Относно *</Label>
                  <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Тема на документа" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reply_to">В отговор на (Вх. №) — незадължително</Label>
                  <Input id="reply_to" value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="напр. 5/2026" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="send_method">Изпратено по</Label>
                  <select id="send_method" value={sendMethod} onChange={(e) => setSendMethod(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Изберете начин...</option>
                    <option value="email">Имейл</option>
                    <option value="courier">Куриер / Български пощи</option>
                    <option value="ssev">ССЕВ</option>
                    <option value="hand">На ръка</option>
                  </select>
                </div>
              </>
            )}

            {/* ЗАПОВЕДИ */}
            {register === 'orders' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="order_type_code">Вид заповед *</Label>
                  <select
                    id="order_type_code"
                    value={orderTypeCode}
                    onChange={async (e) => {
                      setOrderTypeCode(e.target.value);
                      if (!isEdit) await generateOrderNumber(e.target.value);
                    }}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Изберете вид...</option>
                    {orderTypes.map(t => (
                      <option key={t.code} value={t.code}>{t.code} — {t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="number">Регистрационен номер</Label>
                  <Input
                    id="number"
                    value={generatingNumber ? 'Генериране...' : number}
                    readOnly
                    className="bg-gray-50 cursor-not-allowed font-mono"
                    placeholder="Ще се генерира автоматично"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Заглавие *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заглавие на заповедта" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="employee">Служител — незадължително</Label>
                  <Input id="employee" value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Име и длъжност" />
                </div>

                {isLeave(orderType) && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label>От дата *</Label>
                        <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); calcDays(e.target.value, toDate); }} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label>До дата *</Label>
                        <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); calcDays(fromDate, e.target.value); }} required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="days">Брой дни *</Label>
                      <Input id="days" type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} required />
                    </div>
                  </>
                )}

                {isMission(orderType) && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="destination">Дестинация / Място *</Label>
                      <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Град, институция..." required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label>От дата</Label>
                        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>До дата</Label>
                        <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ДОГОВОРИ */}
            {register === 'contracts' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="contract_type">Вид договор *</Label>
                  <select id="contract_type" value={contractType} onChange={(e) => setContractType(e.target.value as ContractType)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="counterparty">Контрагент *</Label>
                  <Input id="counterparty" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Фирма / лице" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Предмет на договора *</Label>
                  <Textarea id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Кратко описание..." rows={2} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Начална дата *</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Крайна дата</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>
                {expiryText && <p className={`text-xs font-medium ${expiryColor}`}>{expiryText}</p>}
                <div className="space-y-1.5">
                  <Label htmlFor="value">Стойност (лв.) — незадължително</Label>
                  <Input id="value" type="number" min="0" step="0.01" placeholder="0.00" value={contractValue} onChange={(e) => setContractValue(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="responsible">Отговорно лице</Label>
                  <select id="responsible" value={showCustomResponsible ? 'Друго лице' : responsiblePerson} onChange={(e) => handleResponsibleChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Изберете...</option>
                    {RESPONSIBLE_PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {showCustomResponsible && (
                    <Input className="mt-2" placeholder="Въведете ime и длъжност..." value={customResponsible} onChange={(e) => setCustomResponsible(e.target.value)} required />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status">Статус</Label>
                  <select id="status" value={contractStatus} onChange={(e) => setContractStatus(e.target.value as ContractStatus)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {CONTRACT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Отговорник — за всички */}
            <div className="space-y-1.5">
              <Label htmlFor="assignee">Отговорник — незадължително</Label>
              <select id="assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {ASSIGNEES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
              </select>
            </div>

            {/* Описание */}
            <div className="space-y-1.5">
              <Label htmlFor="description">
                {register === 'contracts' ? 'Бележки' : 'Описание'} — незадължително
              </Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Допълнително описание..." rows={3} />
            </div>

            {/* Файл */}
            <div className="space-y-1.5">
              <Label>Прикачен файл (PDF или DOCX, макс. 10MB)</Label>
              {existingFileName && !file && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <FileText size={16} className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-700 flex-1 truncate">{existingFileName}</span>
                  <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => setExistingFileName('')}>
                    <X size={16} />
                  </button>
                </div>
              )}
              {file ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                  <FileText size={16} className="text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-700 flex-1 truncate">{file.name}</span>
                  <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => setFile(null)}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                  <Upload size={20} className="text-gray-400 mb-1" />
                  <span className="text-sm text-gray-500">Натиснете за качване</span>
                  <span className="text-xs text-gray-400 mt-1">PDF, DOCX — макс. 10MB</span>
                  <input type="file" className="hidden" accept=".pdf,.docx,.doc" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 text-white flex-1 sm:flex-none sm:px-8">
                {loading ? 'Запазване...' : isEdit ? 'Запази промените' : 'Създай запис'}
              </Button>
              <Link href={`/${register}`}>
                <Button type="button" variant="outline">Отказ</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
