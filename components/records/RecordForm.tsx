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

interface RecordFormProps {
  register: RegisterType;
  initialData?: Record<string, unknown>;
  nextNumber?: string;
  userId: string;
  mode: 'create' | 'edit';
}

export default function RecordForm({ register, initialData, nextNumber, userId, mode }: RecordFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = mode === 'edit';
  const today = new Date().toISOString().slice(0, 10);

  const [number, setNumber] = useState<string>(
    isEdit ? String(initialData?.number || '') : (nextNumber || `1/${getCurrentYear()}`)
  );
  const [date, setDate] = useState<string>(isEdit ? String(initialData?.date || today) : today);

  // Incoming/Outgoing
  const [fromWhom, setFromWhom] = useState(isEdit ? String(initialData?.from_whom || '') : '');
  const [toWhom, setToWhom] = useState(isEdit ? String(initialData?.to_whom || '') : '');
  const [subject, setSubject] = useState(isEdit ? String(initialData?.subject || '') : '');
  const [resolution, setResolution] = useState(isEdit ? String(initialData?.resolution || '') : '');
  const [description, setDescription] = useState(isEdit ? String(initialData?.description || '') : '');

  // Orders
  const [title, setTitle] = useState(isEdit ? String(initialData?.title || '') : '');
  const [orderType, setOrderType] = useState<OrderType | ''>(isEdit ? String(initialData?.order_type || '') as OrderType : '');
  const [employee, setEmployee] = useState(isEdit ? String(initialData?.employee || '') : '');
  const [destination, setDestination] = useState(isEdit ? String(initialData?.destination || '') : '');
  const [fromDate, setFromDate] = useState(isEdit ? String(initialData?.from_date || '') : '');
  const [toDate, setToDate] = useState(isEdit ? String(initialData?.to_date || '') : '');
  const [days, setDays] = useState(isEdit ? String(initialData?.days || '') : '');

  // Contracts
  const [counterparty, setCounterparty] = useState(isEdit ? String(initialData?.counterparty || '') : '');
  const [contractType, setContractType] = useState<ContractType | ''>(isEdit ? String(initialData?.contract_type || '') as ContractType : '');
  const [startDate, setStartDate] = useState(isEdit ? String(initialData?.start_date || '') : today);
  const [endDate, setEndDate] = useState(isEdit ? String(initialData?.end_date || '') : '');
  const [contractValue, setContractValue] = useState(isEdit ? String(initialData?.value || '') : '');
  const [responsiblePerson, setResponsiblePerson] = useState(isEdit ? String(initialData?.responsible_person || '') : '');
  const [customResponsible, setCustomResponsible] = useState('');
  const [showCustomResponsible, setShowCustomResponsible] = useState(false);
  const [contractStatus, setContractStatus] = useState<ContractStatus>(isEdit ? String(initialData?.status || 'active') as ContractStatus : 'active');

  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState(isEdit ? String(initialData?.file_name || '') : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Days calculation for orders
  const calcDays = (from: string, to: string) => {
    if (from && to) {
      const diff = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) setDays(String(diff));
    }
  };

  // Days until contract expiry
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

    // Валидация за договори
    if (register === 'contracts' && startDate && endDate && endDate < startDate) {
      setError('Крайната дата не може да е преди началната дата!');
      setLoading(false);
      return;
    }

    // Валидация за заповеди с дати
    if (register === 'orders' && fromDate && toDate && toDate < fromDate) {
      setError('Крайната дата не може да е преди началната дата!');
      setLoading(false);
      return;
    }

    let fileUrl = isEdit ? String(initialData?.file_url || '') : '';
    let fileName = isEdit ? String(initialData?.file_name || '') : '';

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
    };

    if (register === 'incoming') {
      payload.from_whom = fromWhom;
      payload.subject = subject;
      payload.resolution = resolution;
    }

    if (register === 'outgoing') {
      payload.to_whom = toWhom;
      payload.subject = subject;
      payload.resolution = resolution;
    }

    if (register === 'orders') {
      payload.title = title;
      payload.order_type = orderType;
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
      const { error } = await supabase.from(register).update(payload).eq('id', String(initialData?.id));
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
            {/* Номер и дата */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="number">Регистрационен номер *</Label>
                <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="1/2026" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Дата *</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
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
                  <Label htmlFor="resolution">Резолюция</Label>
                  <select id="resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {RESOLUTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* ЗАПОВЕДИ */}
            {register === 'orders' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Заглавие *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Заглавие на заповедта" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="order_type">Вид заповед *</Label>
                  <select id="order_type" value={orderType} onChange={(e) => setOrderType(e.target.value as OrderType)} required className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {ORDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="employee">Служител *</Label>
                  <Input id="employee" value={employee} onChange={(e) => setEmployee(e.target.value)} placeholder="Име и длъжност" required />
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
