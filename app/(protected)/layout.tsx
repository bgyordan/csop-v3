import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import AutoLogout from '@/components/layout/AutoLogout';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) {
    redirect('/login');
  }
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar profile={profile} />
      <AutoLogout />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
