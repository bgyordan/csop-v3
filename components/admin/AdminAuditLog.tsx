'use client';

import { formatBgDate } from '@/lib/utils/date';
import { Card, CardContent } from '@/components/ui/card';
import { Ban, Trash2, Pencil, Plus, RotateCcw } from 'lucide-react';

interface AuditEntry {
  id: string;
  user_email: string;
  action: string;
  register: string;
  record_number: string;
  details: string;
  created_at: string;
}

const actionConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  cancel: { label: 'Анулиране', color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Ban size={14} /> },
  delete: { label: 'Изтриване', color: 'text-red-600 bg-red-50 border-red-200', icon: <Trash2 size={14} /> },
  edit: { label: 'Редактиране', color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <Pencil size={14} /> },
  create: { label: 'Създаване', color: 'text-green-600 bg-green-50 border-green-200', icon: <Plus size={14} /> },
  restore: { label: 'Възстановяване', color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <RotateCcw size={14} /> },
};

const registerLabels: Record<string, string> = {
  incoming: 'Регистър-входящи',
  outgoing: 'Регистър-изходящи',
  orders: 'Заповеди',
  contracts: 'Договори',
};

interface AdminAuditLogProps {
  entries: AuditEntry[];
}

export default function AdminAuditLog({ entries }: AdminAuditLogProps) {
  if (entries.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6 text-center text-gray-400 py-12">
          Няма записи в одит лога.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const config = actionConfig[entry.action] || { label: entry.action, color: 'text-gray-600 bg-gray-50 border-gray-200', icon: null };
        return (
          <Card key={entry.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium flex-shrink-0 ${config.color}`}>
                  {config.icon}
                  {config.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">{entry.user_email}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{registerLabels[entry.register] || entry.register}</span>
                    {entry.record_number && (
                      <>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-mono text-gray-600">№ {entry.record_number}</span>
                      </>
                    )}
                  </div>
                  {entry.details && (
                    <p className="text-xs text-gray-500 mt-0.5">{entry.details}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(entry.created_at).toLocaleString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
