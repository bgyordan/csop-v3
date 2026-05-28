import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import RecordForm from '@/components/records/RecordForm';
import type { RegisterType } from '@/lib/supabase/types';
import { getCurrentYear } from '@/lib/utils/date';

const VALID_REGISTERS: RegisterType[] = ['incoming', 'outgoing', 'orders', 'contracts'];

export default async function NewRecordPage({
  params,
}: {
  params: Promise<{ register: string }>;
}) {
  const { register } = await params;
  if (!VALID_REGISTERS.includes(register as RegisterType)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'secretary'].includes(profile.role)) {
    redirect(`/${register}`);
  }

  const currentYear = getCurrentYear();

  if (register === 'orders') {
    const { data: orderTypes } = await supabase.from('order_types').select('*').order('code');
    const { data: nomenclatures } = await supabase
      .from('nomenclatures')
      .select('*')
      .eq('register', 'orders')
      .order('code');
    return (
      <RecordForm
        register="orders"
        nextNumber=""
        userId={user.id}
        mode="create"
        orderTypes={(orderTypes || []) as { id: string; code: string; name: string }[]}
        nomenclatures={(nomenclatures || []) as { id: string; code: string; description: string }[]}
      />
    );
  }

  // Входящи и изходящи — зареди номенклатурите
  const { data: nomenclatures } = await supabase
    .from('nomenclatures')
    .select('*')
    .eq('register', register)
    .order('code');

  // Намери следващия номер
  const { data: allRecords } = await supabase
    .from(register as RegisterType)
    .select('number')
    .ilike('number', `%/${currentYear}`);

  let maxNum = 0;
  if (allRecords && allRecords.length > 0) {
    for (const rec of allRecords) {
      const parts = String(rec.number).split('/');
      const num = parseInt(parts[0]);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  }

  const nextNumber = `${maxNum + 1}/${currentYear}`;

  return (
    <RecordForm
      register={register as RegisterType}
      nextNumber={nextNumber}
      userId={user.id}
      mode="create"
      nomenclatures={(nomenclatures || []) as { id: string; code: string; description: string }[]}
    />
  );
}
