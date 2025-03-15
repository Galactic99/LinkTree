'use client';

import { Fragment } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Transition } from '@headlessui/react';
import { 
  UserCircleIcon,
  ChartBarIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LinkTree
              </span>
            </Link>
          </div>

          <div className="flex items-center">
            <Link 
              href="/dashboard/analytics" 
              className="mr-4 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ChartBarIcon className="h-5 w-5" />
              <span>Analytics</span>
            </Link>
            {session?.user && (
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-white dark:ring-gray-800"
                    />
                  ) : (
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  )}
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/settings"
                          className={`${
                            active ? 'bg-gray-50 dark:bg-gray-700' : ''
                          } flex px-4 py-2 text-sm text-gray-700 dark:text-gray-200 items-center gap-2`}
                        >
                          <Cog6ToothIcon className="h-5 w-5" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className={`${
                            active ? 'bg-gray-50 dark:bg-gray-700' : ''
                          } flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 items-center gap-2`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 