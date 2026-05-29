'use client';

import { useState } from 'react';
import AdminUserList from '@/components/admin/AdminUserList';
import AdminNomenclatures from '@/components/admin/AdminNomenclatures';
import AdminAuditLog from '@/components/admin/AdminAuditLog';
import AdminYearlyReport from '@/components/admin/AdminYearlyReport';
import type { Profile } from '@/lib/supabase/types';
import { Users, BookOpen, ClipboardList, FileArchive } from 'lucide-react';

interface Nomenclature {
  id: string;
  register: string;
  code: string;
  description: string;
  created_at: string;
}

interface OrderType {
  id: string;
  code: string;
  name: string;
  retention_years: number | null;
  created_at: string;
}

interface AuditEntry {
  id: string;
  user_email: string;
  action: string;
  register: string;
  record_number: string;
  details: string;
  created_at: string;
}

interface AdminPanelProps {
  users: Profile[];
  currentUserId: string;
  nomenclatures: Nomenclature[];
  orderTypes: OrderType[];
  auditLog: AuditEntry[];
}

export default function AdminPanel({ users, currentUserId, nomenclatures, orderTypes, auditLog }: AdminPanelProps) {
  const [tab, setTab] = useState<'users' | 'nomenclatures' | 'audit' | 'yearly'>('users');

  const tabs = [
    { key: 'users', label: `Потребители (${users.length})`, icon: Users },
    { key: 'nomenclatures', label: 'Номенклатури', icon: BookOpen },
    { key: 'audit', label: 'Одит лог', icon: ClipboardList },
    { key: 'yearly', label: 'Годишен дневник', icon: FileArchive },
  ] as const;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === key ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'users' && <AdminUserList users={users} currentUserId={currentUserId} />}
      {tab === 'nomenclatures' && <AdminNomenclatures nomenclatures={nomenclatures} orderTypes={orderTypes} />}
      {tab === 'audit' && <AdminAuditLog entries={auditLog} />}
      {tab === 'yearly' && <AdminYearlyReport />}
    </div>
  );
}
