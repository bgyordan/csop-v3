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

  // Get next number - взима максималния номер за текущата година
  const currentYear = getCurrentYear();
  const { data: lastRecord } = await supabase
    .from(register as RegisterType)
    .select('number')
    .ilike('number', `%/${currentYear}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let nextNum = 1;
  if (lastRecord?.number) {
    const parts = String(lastRecord.number).split('/');
    const lastNum = parseInt(parts[0]);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }
  const nextNumber = `${nextNum}/${currentYear}`;

  return (
    <RecordForm
      register={register as RegisterType}
      nextNumber={nextNumber}
      userId={user.id}
      mode="create"
    />
  );
}
