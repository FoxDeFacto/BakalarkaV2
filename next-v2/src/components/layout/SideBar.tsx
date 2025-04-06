// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  HomeIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const { isStudent, isTeacher, isAdmin } = useAuth();
  const pathname = usePathname();

  // Base navigation items for all authenticated users
  const navigation = [
    { name: 'Přehled', href: '/dashboard', icon: HomeIcon, current: pathname === '/dashboard' },
    { 
      name: 'Všechny projekty', 
      href: '/dashboard/projects', 
      icon: DocumentTextIcon, 
      current: pathname === '/dashboard/projects' 
    },
  ];

  // Add role-specific items
  if (isStudent) {
    navigation.push(
      { 
        name: 'Moje projekty', 
        href: '/dashboard/my-projects', 
        icon: DocumentTextIcon, 
        current: pathname === '/dashboard/my-projects' 
      },
      { 
        name: 'Vytvořit projekt', 
        href: '/dashboard/create-project', 
        icon: PlusIcon, 
        current: pathname === '/dashboard/create-project' 
      }
    );
  }

  if (isTeacher || isAdmin) {
    navigation.push(
      { 
        name: 'Přiřezené projekty', 
        href: '/dashboard/assigned', 
        icon: ClipboardDocumentCheckIcon, 
        current: pathname === '/dashboard/assigned' 
      },
      { 
        name: 'Konzultace', 
        href: '/dashboard/consultations', 
        icon: CalendarIcon, 
        current: pathname === '/dashboard/consultations' 
      },
      { 
        name: 'Hodnocení', 
        href: '/dashboard/evaluations', 
        icon: ChartBarIcon, 
        current: pathname === '/dashboard/evaluations' 
      }
    );
  }

  if (isAdmin) {
    navigation.push({ 
      name: 'Uživatelé', 
      href: '/dashboard/users', 
      icon: UserGroupIcon, 
      current: pathname === '/dashboard/users' 
    });
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900">Přehled</h2>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`${
                  item.current
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-700 hover:bg-gray-100'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    item.current ? 'text-orange-600' : 'text-gray-500 group-hover:text-gray-600'
                  } mr-3 h-5 w-5`}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}