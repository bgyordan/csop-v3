import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import RecordForm from '@/components/records/RecordForm';
import type { RegisterType } from '@/lib/supabase/types';

const VALID_REGISTERS: RegisterType[] = ['incoming', 'outgoing', 'orders', 'contracts'];

export default async function EditRecordPage({
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
  if (!profile || !['admin', 'secretary'].includes(profile.role)) {
    redirect(`/records/${register}/${id}`);
  }

  const { data: record } = await supabase
    .from(register as RegisterType)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!record) notFound();

  return (
    <RecordForm
      register={register as RegisterType}
      initialData={record as Record<string, unknown>}
      userId={user.id}
      mode="edit"
    />
  );
}
