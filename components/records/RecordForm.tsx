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
  const [date, setDate] = useState<string>(
    isEdit ? String(initialData?.date || today) : today
  );
  const [fromWhom, setFromWhom] = useState(isEdit ? String(initialData?.from_whom || '') : '');
  const [toWhom, setToWhom] = useState(isEdit ? String(initialData?.to_whom || '') : '');
  const [subject, setSubject] = useState(isEdit ? String(initialData?.subject || '') : '');
  const [title, setTitle] = useState(isEdit ? String(initialData?.title || '') : '');
  const [counterparty, setCounterparty] = useState(isEdit ? String(initialData?.counterparty || '') : '');
  const [startDate, setStartDate] = useState(isEdit ? String(initialData?.start_date || '') : '');
  const [endDate, setEndDate] = useState(isEdit ? String(initialData?.end_date || '') : '');
  const [description, setDescription] = useState(isEdit ? String(initialData?.description || '') : '');

  // Order specific fields
  const [orderType, setOrderType] = useState<OrderType | ''>(isEdit ? String(initialData?.order_type || '') as OrderType : '');
  const [employee, setEmployee] = useState(isEdit ? String(initialData?.employee || '') : '');
  const [destination, setDestination] = useState(isEdit ? String(initialData?.destination || '') : '');
  const [fromDate, setFromDate] = useState(isEdit ? String(initialData?.from_date || '') : '');
  const [toDate, setToDate] = useState(isEdit ? String(initialData?.to_date || '') : '');
  const [days, setDays] = useState(isEdit ? String(initialData?.days || '') : '');

  const [file, setFile] = useState<File | null>(null);
  const [existingFileName, setExistingFileName] = useState(isEdit ? String(initialData?.file_name || '') : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calcDays = (from: string, to: string) => {
    if (from && to) {
      const diff = Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (diff > 0) setDays(String(diff));
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

    if (register === 'incoming') payload.from_whom = fromWhom;
    if (register === 'outgoing') payload.to_whom = toWhom;
    if (register === 'incoming' || register === 'outgoing' || register === 'contracts') payload.subject = subject;
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
      payload.start_date = startDate || null;
      payload.end_date = endDate || null;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="number">Регистрационен номер *</Label>
                <Input
                  id="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="1/2026"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Дата *</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {register === 'incoming' && (
              <div className="space-y-1.5">
                <Label htmlFor="from_whom">От кого *</Label>
                <Input
                  id="from_whom"
                  value={fromWhom}
                  onChange={(e) => setFromWhom(e.target.value)}
                  placeholder="Институция / лице"
                  required
                />
              </div>
            )}

            {register === 'outgoing' && (
              <div className="space-y-1.5">
                <Label htmlFor="to_whom">До кого *</Label>
                <Input
                  id="to_whom"
                  value={toWhom}
                  onChange={(e) => setToWhom(e.target.value)}
                  placeholder="Институция / лице"
                  required
                />
              </div>
            )}

            {(register === 'incoming' || register === 'outgoing' || register === 'contracts') && (
              <div className="space-y-1.5">
                <Label htmlFor="subject">Относно *</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Тема на документа"
                  required
                />
              </div>
            )}

            {register === 'orders' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="title">Заглавие *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Заглавие на заповедта"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="order_type">Вид заповед *</Label>
                  <select
                    id="order_type"
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value as OrderType)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {ORDER_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="employee">Служител *</Label>
                  <Input
                    id="employee"
                    value={employee}
                    onChange={(e) => setEmployee(e.target.value)}
                    placeholder="Име и длъжност"
                    required
                  />
                </div>

                {isLeave(orderType) && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="from_date">От дата *</Label>
                        <Input
                          id="from_date"
                          type="date"
                          value={fromDate}
                          onChange={(e) => { setFromDate(e.target.value); calcDays(e.target.value, toDate); }}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="to_date">До дата *</Label>
                        <Input
                          id="to_date"
                          type="date"
                          value={toDate}
                          onChange={(e) => { setToDate(e.target.value); calcDays(fromDate, e.target.value); }}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="days">Брой дни *</Label>
                      <Input
                        id="days"
                        type="number"
                        min="1"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                {isMission(orderType) && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="destination">Дестинация / Място *</Label>
                      <Input
                        id="destination"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Град, институция..."
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <Label htmlFor="from_date">От дата</Label>
                        <Input
                          id="from_date"
                          type="date"
                          value={fromDate}
                          onChange={(e) => setFromDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="to_date">До дата</Label>
                        <Input
                          id="to_date"
                          type="date"
                          value={toDate}
                          onChange={(e) => setToDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {register === 'contracts' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="counterparty">Контрагент *</Label>
                  <Input
                    id="counterparty"
                    value={counterparty}
                    onChange={(e) => setCounterparty(e.target.value)}
                    placeholder="Фирма / лице"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="start_date">Начална дата</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="end_date">Крайна дата</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Допълнително описание..."
                rows={4}
              />
            </div>

            {/* File upload */}
            <div className="space-y-1.5">
              <Label>Прикачен файл (PDF или DOCX, макс. 10MB)</Label>
              {existingFileName && !file && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <FileText size={16} className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-blue-700 flex-1 truncate">{existingFileName}</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-red-500"
                    onClick={() => setExistingFileName('')}
                  >
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
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.doc"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-700 hover:bg-blue-800 text-white flex-1 sm:flex-none sm:px-8"
              >
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
