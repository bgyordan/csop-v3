import { createClient } from '@/lib/supabase/server';
import { formatBgDate } from '@/lib/utils/date';
import { REGISTER_LABELS } from '@/lib/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Inbox, Send, FileText, ScrollText, Clock, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import GlobalSearch from '@/components/GlobalSearch';

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

  const canEdit = profile?.role === 'admin' || profile?.role === 'secretary';

  const today = new Date();
  const in30Days = new Date(today);
  in30Days.setDate(today.getDate() + 30);
  const todayStr = today.toISOString().split('T')[0];
  const in30DaysStr = in30Days.toISOString().split('T')[0];

  const [
    { count: incomingCount },
    { count: outgoingCount },
    { count: ordersCount },
    { count: contractsCount },
    { data: lastIncoming },
    { data: lastOutgoing },
    { data: lastOrders },
    { data: lastContracts },
    { data: recentIncoming },
    { data: recentOutgoing },
    { data: recentOrders },
    { data: recentContracts },
    { data: expiringContracts },
  ] = await Promise.all([
    supabase.from('incoming').select('*', { count: 'exact', head: true }),
    supabase.from('outgoing').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('contracts').select('*', { count: 'exact', head: true }),
    supabase.from('incoming').select('number').order('created_at', { ascending: false }).limit(1),
    supabase.from('outgoing').select('number').order('created_at', { ascending: false }).limit(1),
    supabase.from('orders').select('number').order('created_at', { ascending: false }).limit(1),
    supabase.from('contracts').select('number').order('created_at', { ascending: false }).limit(1),
    supabase.from('incoming').select('*').order('created_at', { ascending: false }).limit(2),
    supabase.from('outgoing').select('*').order('created_at', { ascending: false }).limit(2),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(1),
    supabase.from('contracts').select('*').order('created_at', { ascending: false }).limit(1),
    supabase.from('contracts').select('*').gte('end_date', todayStr).lte('end_date', in30DaysStr).order('end_date', { ascending: true }),
  ]);

  const getLastNumber = (records: Array<{ number: string }> | null) => {
    if (!records || records.length === 0) return null;
    return records[0].number;
  };

  const lastNumbers = {
    incoming: getLastNumber(lastIncoming as Array<{ number: string }> | null),
    outgoing: getLastNumber(lastOutgoing as Array<{ number: string }> | null),
    orders: getLastNumber(lastOrders as Array<{ number: string }> | null),
    contracts: getLastNumber(lastContracts as Array<{ number: string }> | null),
  };

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
    .slice(0, 5);

  const counts = [
    { key: 'incoming', count: incomingCount ?? 0 },
    { key: 'outgoing', count: outgoingCount ?? 0 },
    { key: 'orders', count: ordersCount ?? 0 },
    { key: 'contracts', count: contractsCount ?? 0 },
  ] as const;

  const expiring = (expiringContracts || []) as Array<{ id: string; number: string; counterparty: string; end_date: string; status: string }>;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Добре дошли, {profile?.full_name || profile?.email}!
        </h1>
        <p className="text-gray-500 mt-1">
          {today.toLocaleDateString('bg-BG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="mb-6">
        <GlobalSearch />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {counts.map(({ key, count }) => {
          const Icon = registerIcons[key];
          const colorClass = registerColors[key];
          const lastNum = lastNumbers[key];
          return (
            <Link key={key} href={`/${key}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-3xl font-bold text-gray-900">{count}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{REGISTER_LABELS[key]}</p>
                  {lastNum && (
                    <p className="text-xs text-gray-400 font-mono">текущ №: {lastNum}</p>
                  )}
                  {!lastNum && count > 0 && (
                    <p className="text-xs text-gray-300 font-mono">няма записи</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {canEdit && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Plus size={16} className="text-gray-400" />
                <CardTitle className="text-sm font-semibold text-gray-700">Бърз достъп</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/records/incoming/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 text-blue-700 border-blue-200 hover:bg-blue-50">
                  <Inbox size={15} />Нов входящ
                </Button>
              </Link>
              <Link href="/records/outgoing/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 text-green-700 border-green-200 hover:bg-green-50">
                  <Send size={15} />Нов изходящ
                </Button>
              </Link>
              <Link href="/records/orders/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 text-orange-700 border-orange-200 hover:bg-orange-50">
                  <FileText size={15} />Нова заповед
                </Button>
              </Link>
              <Link href="/records/contracts/new" className="block">
                <Button variant="outline" className="w-full justify-start gap-2 h-10 text-purple-700 border-purple-200 hover:bg-purple-50">
                  <ScrollText size={15} />Нов договор
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <Card className={`border-0 shadow-sm ${canEdit ? '' : 'lg:col-span-1'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <CardTitle className="text-sm font-semibold text-gray-700">Договори изтичащи до 30 дни</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {expiring.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-600 py-2">
                <CheckCircle size={16} />
                <span>Няма изтичащи договори</span>
              </div>
            ) : (
              <div className="space-y-2">
                {expiring.map((c) => {
                  const daysLeft = Math.ceil((new Date(c.end_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysLeft <= 7;
                  return (
                    <Link key={c.id} href={`/records/contracts/${c.id}`} className="block">
                      <div className={`p-3 rounded-lg border text-sm ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} hover:opacity-80 transition-opacity`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-medium text-gray-700">№ {c.number}</span>
                          <span className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                            {daysLeft === 0 ? 'Днес!' : `${daysLeft} дни`}
                          </span>
                        </div>
                        <p className="text-gray-600 truncate">{c.counterparty}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Изтича: {formatBgDate(c.end_date)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-sm ${canEdit ? '' : 'lg:col-span-2'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <CardTitle className="text-sm font-semibold text-gray-700">Последно добавени</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {allRecent.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Няма записи все още.</p>
            ) : (
              <div className="space-y-1">
                {allRecent.map((record) => (
                  <Link
                    key={`${record.register}-${record.id}`}
                    href={`/records/${record.register}/${record.id}`}
                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${registerBadgeColors[record.register]}`}>
                      {REGISTER_LABELS[record.register]}
                    </span>
                    <span className="text-xs font-medium text-gray-600 font-mono flex-shrink-0">№ {record.number}</span>
                    <span className="flex-1 text-sm text-gray-500 truncate group-hover:text-gray-700">{record.label}</span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatBgDate(record.date)}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
