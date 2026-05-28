Кодът за компонента `Sidebar` е написан много чисто и структуриран правилно. Ползването на променливата `sidebarContent`, за да се избегне дублирането на JSX кода за десктоп и мобилната версия, е отлична практика.

Има обаче **три детайла**, които си струва да се коригират или оптимизират, за да нямаш проблеми с визуализацията, стиловете (особено при Тъмна тема) и TypeScript.

---

### 1. Проблем със стиловете на ролите (Role Badges) при Тъмна тема

В момента в `roleColors` дефинираш статични Tailwind класове, които изглеждат добре на светъл фон, но при активирана тъмна тема (`dark`) текстът ще стане трудно четим или ще изглежда не на място:

```typescript
const roleColors: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  secretary: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

```

### 2. Използване на `w-4.5` и `h-4.5`

Вътре в мапинга на навигацията имаш следния клас:

```typescript
className={cn('w-4.5 h-4.5 flex-shrink-0', ...)}

```

По подразбиране в Tailwind CSS **няма** класове `w-4.5` или `h-4.5` (има `w-4`, което е 1rem/16px, и `w-5`, което е 1.25rem/20px). Тъй като веднага след това подаваш и проп `size={18}` към Lucide иконата (който генерира inline стилове `width: 18px; height: 18px;`), тези несъществуващи класове просто ще бъдат игнорирани. Най-добре е да ги премахнеш, за да не цапат HTML-а:

```typescript
<Icon className="flex-shrink-0" size={18} />

```

### 3. Оптимизация на `useTheme` за избягване на Hydration Mismatch

Бутонът за превключване на темата чете `theme` директно. При първоначално зареждане (SSR) на сървъра стойността на `theme` е `undefined`, докато на клиента `next-themes` я определя. Това може да причини разминаване на иконата (Sun/Moon). Обикновено се добавя един бърз `mounted` стейт:

```typescript
import { useState, useEffect } from 'react';
// ... вътре в компонента:
const [mounted, setMounted] = useState(false);
const { theme, setTheme } = useTheme();

useEffect(() => {
  setMounted(true);
}, []);

// На мястото на иконата:
{mounted && (theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />)}

```

---

### Ето коригирания и оптимизиран код:

```tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/supabase/types';
import { ROLE_LABELS } from '@/lib/supabase/types';
import {
  LayoutDashboard,
  Inbox,
  Send,
  FileText,
  ScrollText,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface SidebarProps {
  profile: Profile;
}

const navItems = [
  { href: '/dashboard', label: 'Начало', icon: LayoutDashboard },
  { href: '/incoming', label: 'Регистър-входящи', icon: Inbox },
  { href: '/outgoing', label: 'Регистър-изходящи', icon: Send },
  { href: '/orders', label: 'Заповеди', icon: FileText },
  { href: '/contracts', label: 'Договори', icon: ScrollText },
];

const roleColors: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  secretary: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Избягване на hydration грешки за иконата на темата
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/CsopLOGO.jpg"
            alt="ЦСОП Варна"
            width={40}
            height={40}
            className="rounded-lg flex-shrink-0"
          />
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">ЦСОП Варна</p>
            <p className="text-xs text-gray-400">Деловодна система</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon 
                className={cn('flex-shrink-0', isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400')} 
                size={18} 
              />
              {label}
            </Link>
          );
        })}

        {profile.role === 'admin' && (
          <>
            <div className="pt-2 pb-1">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Администрация
              </p>
            </div>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/admin')
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <ShieldCheck className={cn('flex-shrink-0', pathname.startsWith('/admin') ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400')} size={18} />
              Потребители
            </Link>
          </>
        )}
      </nav>

      {/* User info + Logout */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-blue-700 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {profile.full_name || profile.email}
            </p>
            <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5', roleColors[profile.role])}>
              {ROLE_LABELS[profile.role]}
            </span>
          </div>
          {/* Dark mode toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            title={theme === 'dark' ? 'Светла тема' : 'Тъмна тема'}
          >
            {mounted && (theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />)}
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2"
          onClick={handleLogout}
        >
          <LogOut size={16} />
          Изход
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 left-0 z-50 w-64 h-full transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 h-full">
        {sidebarContent}
      </aside>
    </>
  );
}

```
