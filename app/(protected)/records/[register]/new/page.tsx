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

  // Get next number
  const { count } = await supabase.from(register as RegisterType).select('*', { count: 'exact', head: true });
  const nextNum = (count || 0) + 1;
  const nextNumber = `${nextNum}/${getCurrentYear()}`;

  return (
    <RecordForm
      register={register as RegisterType}
      nextNumber={nextNumber}
      userId={user.id}
      mode="create"
    />
  );
}
