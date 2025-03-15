'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Linktree {
  _id: string;
  title: string;
  slug: string;
  theme: string;
  isDefault: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [linktrees, setLinktrees] = useState<Linktree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLinktrees = async () => {
      try {
        const response = await fetch('/api/linktrees');
        const data = await response.json();
        setLinktrees(data);
      } catch (error) {
        console.error('Error fetching linktrees:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinktrees();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Your Linktrees</h1>
        <Link
          href="/dashboard/create"
          className="inline-flex items-center px-4 py-2 rounded-lg backdrop-blur-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create New
        </Link>
      </div>

      {linktrees.length === 0 ? (
        <div className="text-center py-12 backdrop-blur-lg bg-white/5 rounded-2xl border border-white/10 shadow-2xl">
          <h3 className="mt-2 text-sm font-medium text-white">No Linktrees</h3>
          <p className="mt-1 text-sm text-gray-300">
            Get started by creating a new Linktree.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/create"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create New Linktree
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {linktrees.map((linktree) => (
            <Link
              key={linktree._id}
              href={`/dashboard/${linktree._id}`}
              className="block backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-1"
            >
              <div className="p-6">
                <h3 className="text-lg font-medium text-white">
                  {linktree.title}
                </h3>
                <p className="mt-1 text-sm text-gray-300">
                  /{linktree.slug}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-400/10 text-blue-400 border border-blue-400/20">
                    {linktree.theme}
                  </span>
                  {linktree.isDefault && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400 border border-green-400/20">
                      Default
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 