import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RegisterTable from '@/components/records/RegisterTable';
import type { Role } from '@/lib/supabase/types';

const PAGE_SIZE = 20;

export default async function IncomingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; year?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
  if (!profile) redirect('/login');
  const userRole = (profile as { role: Role }).role;

  const page = Math.max(1, parseInt(params.page || '1'));
  const q = params.q || '';
  const year = params.year || '';
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('incoming')
    .select('*', { count: 'exact' })
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`number.ilike.%${q}%,subject.ilike.%${q}%,from_whom.ilike.%${q}%`);
  }
  if (year) {
    query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
  }

  const { data, count } = await query;

  return (
    <RegisterTable
      register="incoming"
      title="Регистър-входящи"
      data={(data || []) as Record<string, unknown>[]}
      userRole={userRole}
      userId={user.id}
      userEmail={profile.email}
      totalCount={count || 0}
      page={page}
      pageSize={PAGE_SIZE}
      searchValue={q}
      yearValue={year}
    />
  );
}
