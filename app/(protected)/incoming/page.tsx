import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RegisterTable from '@/components/records/RegisterTable';
import { formatBgDate } from '@/lib/utils/date';
import type { Role } from '@/lib/supabase/types';

const PAGE_SIZE = 20;

export default async function IncomingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
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

  const { data, count } = await query;

  const columns = [
    { key: 'number', label: '№', render: (v: unknown) => <span className="font-mono font-medium text-blue-700">{String(v)}</span> },
    { key: 'date', label: 'Дата', render: (v: unknown) => formatBgDate(v as string) },
    { key: 'from_whom', label: 'От кого' },
    { key: 'subject', label: 'Относно' },
    {
      key: 'file_name',
      label: 'Файл',
      render: (v: unknown) => v ? (
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded font-medium">PDF/DOCX</span>
      ) : <span className="text-gray-300">—</span>,
    },
  ];

  return (
    <RegisterTable
      register="incoming"
      title="Входяща поща"
      data={(data || []) as Record<string, unknown>[]}
      columns={columns}
      userRole={userRole}
      totalCount={count || 0}
      page={page}
      pageSize={PAGE_SIZE}
      searchValue={q}
    />
  );
}
