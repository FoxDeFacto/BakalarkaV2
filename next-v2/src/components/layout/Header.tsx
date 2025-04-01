// src/components/layout/Header.tsx
'use client';

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';

export default function Header() {
  const { user, isAuthenticated, isStudent, isTeacher, isAdmin, logout, loading } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  // Use useEffect to handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for component to be mounted before rendering anything with state
  if (!mounted) {
    return (
      <nav className="bg-blue-800">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-white font-bold text-xl">ProjectHub</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Still loading auth state
  if (loading) {
    return (
      <nav className="bg-blue-800">
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-16 items-center justify-between">
            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex flex-shrink-0 items-center">
                <span className="text-white font-bold text-xl">ProjectHub</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // Navigation items based on user role
  const navigation = [
    { name: 'Home', href: '/', current: pathname === '/' },
    { name: 'Projects', href: '/projects-public', current: pathname === '/projects-public' },
  ];

  if (isAuthenticated) {
    navigation.push({ name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' });
    
    if (isStudent) {
      navigation.push({ name: 'My Projects', href: '/dashboard/projects', current: pathname === '/dashboard/projects' });
    }
    
    if (isTeacher || isAdmin) {
      navigation.push({ name: 'Assigned Projects', href: '/dashboard/assigned', current: pathname === '/dashboard/assigned' });
      navigation.push({ name: 'Evaluations', href: '/dashboard/evaluations', current: pathname === '/dashboard/evaluations' });
    }
  }

  return (
    <Disclosure as="nav" className="bg-blue-800">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div className="relative flex h-16 items-center justify-between">
              <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                {/* Mobile menu button */}
                <Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-blue-200 hover:bg-blue-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                  <span className="absolute -inset-0.5" />
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
              <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                <div className="flex flex-shrink-0 items-center">
                  <span className="text-white font-bold text-xl">ProjectHub</span>
                </div>
                <div className="hidden sm:ml-6 sm:block">
                  <div className="flex space-x-4">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`${
                          item.current
                            ? 'bg-blue-900 text-white'
                            : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                        } rounded-md px-3 py-2 text-sm font-medium`}
                        aria-current={item.current ? 'page' : undefined}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                {/* Profile dropdown */}
                {isAuthenticated ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="relative flex rounded-full bg-blue-700 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-800">
                        <span className="absolute -inset-1.5" />
                        <span className="sr-only">Open user menu</span>
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          {user?.username.charAt(0).toUpperCase()}
                        </div>
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          <div>{user?.username}</div>
                          <div className="text-gray-500">{user?.email}</div>
                          <div className="text-xs text-gray-500">{user?.role}</div>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } block px-4 py-2 text-sm text-gray-700`}
                            >
                              Your Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={logout}
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex space-x-2">
                    <Link
                      href="/login"
                      className="bg-blue-700 text-white hover:bg-blue-600 rounded-md px-3 py-2 text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="bg-white text-blue-800 hover:bg-blue-100 rounded-md px-3 py-2 text-sm font-medium"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={`${
                    item.current
                      ? 'bg-blue-900 text-white'
                      : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                  } block rounded-md px-3 py-2 text-base font-medium`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}