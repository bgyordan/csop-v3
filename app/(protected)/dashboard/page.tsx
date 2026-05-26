import { createClient } from '@/lib/supabase/server';
import { formatBgDate } from '@/lib/utils/date';
import { REGISTER_LABELS } from '@/lib/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox, Send, FileText, ScrollText, Clock } from 'lucide-react';
import Link from 'next/link';

const registerIcons = {
  incoming: Inbox,
  outgoing: Send,
  orders: FileText,
  contracts: ScrollText,
};

const registerColors = {
  incoming: 'text-blue-600 bg-blue-50',
  outgoing: 'text-green-600 bg-green-50',
  orders: 'text-orange-600 bg-orange-50',
  contracts: 'text-purple-600 bg-purple-50',
};

const registerBadgeColors: Record<string, string> = {
  incoming: 'bg-blue-50 text-blue-700 border-blue-200',
  outgoing: 'bg-green-50 text-green-700 border-green-200',
  orders: 'bg-orange-50 text-orange-700 border-orange-200',
  contracts: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
  const profile = profileData as { id: string; email: string; full_name: string; role: string } | null;

  const [
    { count: incomingCount },
    { count: outgoingCount },
    { count: ordersCount },
    { count: contractsCount },
    { data: recentIncoming },
    { data: recentOutgoing },
    { data: recentOrders },
    { data: recentContracts },
  ] = await Promise.all([
    supabase.from('incoming').select('*', { count: 'exact', head: true }),
    supabase.from('outgoing').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('*', { count: 'exact', head: true }),
    supabase.from('incoming').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('outgoing').select('*').order('created_at', { ascending: false }).limit(3),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(2),
    supabase.from('contracts').select('*').order('created_at', { ascending: false }).limit(2),
  ]);

  type RecentItem = { id: string; number: string; date: string; created_at: string; register: 'incoming' | 'outgoing' | 'orders' | 'contracts'; label: string };
  const ri = (recentIncoming || []) as Array<{ id: string; number: string; date: string; created_at: string; subject: string }>;
  const ro = (recentOutgoing || []) as Array<{ id: string; number: string; date: string; created_at: string; subject: string }>;
  const rord = (recentOrders || []) as Array<{ id: string; number: string; date: string; created_at: string; title: string }>;
  const rc = (recentContracts || []) as Array<{ id: string; number: string; date: string; created_at: string; subject: string }>;

  const allRecent: RecentItem[] = [
    ...ri.map((r) => ({ id: r.id, number: r.number, date: r.date, created_at: r.created_at, register: 'incoming' as const, label: r.subject || '' })),
    ...ro.map((r) => ({ id: r.id, number: r.number, date: r.date, created_at: r.created_at, register: 'outgoing' as const, label: r.subject || '' })),
    ...rord.map((r) => ({ id: r.id, number: r.number, date: r.date, created_at: r.created_at, register: 'orders' as const, label: r.title || '' })),
    ...rc.map((r) => ({ id: r.id, number: r.number, date: r.date, created_at: r.created_at, register: 'contracts' as const, label: r.subject || '' })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);

  const counts = [
    { key: 'incoming', count: incomingCount ?? 0 },
    { key: 'outgoing', count: outgoingCount ?? 0 },
    { key: 'orders', count: ordersCount ?? 0 },
    { key: 'contracts', count: contractsCount ?? 0 },
  ] as const;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Добре дошли, {profile?.full_name || profile?.email}!
        </h1>
        <p className="text-gray-500 mt-1">
          Преглед на деловодната система на ЦСОП Варна
        </p>
      </div>

      {/* Count cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {counts.map(({ key, count }) => {
          const Icon = registerIcons[key];
          const colorClass = registerColors[key];
          return (
            <Link key={key} href={`/${key}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon size={22} />
                    </div>
                    <span className="text-3xl font-bold text-gray-900">{count}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600">{REGISTER_LABELS[key]}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            <CardTitle className="text-base font-semibold text-gray-800">Последна активност</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {allRecent.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Няма записи все още.</p>
          ) : (
            <div className="space-y-1">
              {allRecent.map((record) => (
                <Link
                  key={`${record.register}-${record.id}`}
                  href={`/records/${record.register}/${record.id}`}
                  className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${registerBadgeColors[record.register]}`}>
                    {REGISTER_LABELS[record.register]}
                  </span>
                  <span className="text-sm font-medium text-gray-700 font-mono">№ {record.number}</span>
                  <span className="flex-1 text-sm text-gray-500 truncate group-hover:text-gray-700">
                    {record.label}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">{formatBgDate(record.date)}</span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
