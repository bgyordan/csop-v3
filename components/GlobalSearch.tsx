'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Inbox, Send, FileText, ScrollText, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatBgDate } from '@/lib/utils/date';

type SearchResult = {
  id: string;
  number: string;
  date: string;
  label: string;
  register: 'incoming' | 'outgoing' | 'orders' | 'contracts';
};

const registerConfig = {
  incoming: { label: 'Регистър-входящи', icon: Inbox, color: 'text-blue-600 bg-blue-50' },
  outgoing: { label: 'Регистър-изходящи', icon: Send, color: 'text-green-600 bg-green-50' },
  orders: { label: 'Заповеди', icon: FileText, color: 'text-orange-600 bg-orange-50' },
  contracts: { label: 'Договори', icon: ScrollText, color: 'text-purple-600 bg-purple-50' },
};

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const q = `%${query}%`;

      const [inc, out, ord, con] = await Promise.all([
        supabase.from('incoming').select('id, number, date, subject').or(`number.ilike.${q},subject.ilike.${q},from_whom.ilike.${q}`).limit(4),
        supabase.from('outgoing').select('id, number, date, subject').or(`number.ilike.${q},subject.ilike.${q},to_whom.ilike.${q}`).limit(4),
        supabase.from('orders').select('id, number, date, title').or(`number.ilike.${q},title.ilike.${q}`).limit(4),
        supabase.from('contracts').select('id, number, date, subject').or(`number.ilike.${q},subject.ilike.${q},counterparty.ilike.${q}`).limit(4),
      ]);

      const all: SearchResult[] = [
        ...(inc.data || []).map(r => ({ id: r.id, number: r.number, date: r.date, label: r.subject || '', register: 'incoming' as const })),
        ...(out.data || []).map(r => ({ id: r.id, number: r.number, date: r.date, label: r.subject || '', register: 'outgoing' as const })),
        ...(ord.data || []).map(r => ({ id: r.id, number: r.number, date: r.date, label: r.title || '', register: 'orders' as const })),
        ...(con.data || []).map(r => ({ id: r.id, number: r.number, date: r.date, label: r.subject || '', register: 'contracts' as const })),
      ];

      setResults(all);
      setOpen(all.length > 0);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(result: SearchResult) {
    setQuery('');
    setOpen(false);
    router.push(`/records/${result.register}/${result.id}`);
  }

  return (
    <div ref={ref} className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Търси по номер, тема, контрагент..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button onClick={() => { setQuery(''); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-400">Търсене...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400">Няма резултати</div>
          ) : (
            <div>
              {results.map(result => {
                const config = registerConfig[result.register];
                const Icon = config.icon;
                return (
                  <button
                    key={`${result.register}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">{config.label}</span>
                        <span className="text-xs font-mono text-gray-600">№ {result.number}</span>
                      </div>
                      <p className="text-sm text-gray-800 truncate">{result.label}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{formatBgDate(result.date)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
