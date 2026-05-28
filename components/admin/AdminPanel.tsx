'use client';

import { useState } from 'react';
import AdminUserList from '@/components/admin/AdminUserList';
import AdminNomenclatures from '@/components/admin/AdminNomenclatures';
import type { Profile } from '@/lib/supabase/types';
import { Users, BookOpen } from 'lucide-react';

interface Nomenclature {
  id: string;
  register: string;
  code: string;
  description: string;
  created_at: string;
}

interface AdminPanelProps {
  users: Profile[];
  currentUserId: string;
  nomenclatures: Nomenclature[];
}

export default function AdminPanel({ users, currentUserId, nomenclatures }: AdminPanelProps) {
  const [tab, setTab] = useState<'users' | 'nomenclatures'>('users');

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'users'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users size={16} />
          Потребители ({users.length})
        </button>
        <button
          onClick={() => setTab('nomenclatures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'nomenclatures'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BookOpen size={16} />
          Номенклатури
        </button>
      </div>

      {tab === 'users' && (
        <AdminUserList users={users} currentUserId={currentUserId} />
      )}
      {tab === 'nomenclatures' && (
        <AdminNomenclatures nomenclatures={nomenclatures} />
      )}
    </div>
  );
}
