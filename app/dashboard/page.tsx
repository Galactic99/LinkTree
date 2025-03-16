'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeleteLinktree = async (e: React.MouseEvent, slug: string, id: string) => {
    e.preventDefault(); // Prevent navigation to the edit page
    e.stopPropagation(); // Stop event propagation
    
    if (!confirm('Are you sure you want to delete this linktree? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/linktrees/${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete linktree');
      }

      // Remove the deleted linktree from the state
      setLinktrees(linktrees.filter(lt => lt._id !== id));
    } catch (error) {
      console.error('Error deleting linktree:', error);
      alert('Failed to delete linktree. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

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
            <div
              key={linktree._id}
              className="relative backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-1"
            >
              <Link
                href={`/dashboard/${linktree.slug}`}
                className="block p-6"
              >
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
              </Link>
              <button
                onClick={(e) => handleDeleteLinktree(e, linktree.slug, linktree._id)}
                disabled={deletingId === linktree._id}
                className="absolute top-2 right-2 p-2 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-colors"
                title="Delete Linktree"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 