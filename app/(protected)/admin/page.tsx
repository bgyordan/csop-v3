import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminPanel from '@/components/admin/AdminPanel';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('id, role').eq('id', user.id).maybeSingle();
  if (!profile || (profile as { role: string }).role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });

  const { data: nomenclatures } = await supabase
    .from('nomenclatures')
    .select('*')
    .order('register')
    .order('code');

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Администрация</h1>
        <p className="text-gray-500 mt-1">Управление на потребители и номенклатури</p>
      </div>
      <AdminPanel
        users={users || []}
        currentUserId={user.id}
        nomenclatures={nomenclatures || []}
      />
    </div>
  );
}
