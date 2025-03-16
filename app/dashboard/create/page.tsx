'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CreateLinktree() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    theme: 'dark',
    isDefault: false,
    isPublic: true,
    footer: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/linktrees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create Linktree');
      }

      const linktree = await response.json();
      router.push(`/dashboard/${linktree.slug}`);
    } catch (err) {
      console.error('Error creating linktree:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-6">
        Create New Linktree
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6 backdrop-blur-md bg-white/5 rounded-lg shadow-lg border border-white/10 p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-white">
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white bg-gray-800 border-gray-700"
          />
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-white">
            URL Slug
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-700 bg-gray-800 px-3 text-gray-400 sm:text-sm">
              /
            </span>
            <input
              type="text"
              id="slug"
              name="slug"
              required
              value={formData.slug}
              onChange={handleChange}
              pattern="[a-z0-9-]+"
              title="Only lowercase letters, numbers, and hyphens are allowed"
              className="block w-full rounded-none rounded-r-md border border-gray-700 py-2 px-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white bg-gray-800"
            />
          </div>
        </div>

        <div>
          <label htmlFor="footer" className="block text-sm font-medium text-white">
            Footer Text
          </label>
          <input
            type="text"
            id="footer"
            name="footer"
            value={formData.footer}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-700 py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-white bg-gray-800"
            placeholder="Add your custom footer text"
          />
          <p className="mt-1 text-sm text-gray-400">
            Leave empty to remove footer
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              name="isDefault"
              checked={formData.isDefault}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-800"
            />
            <label htmlFor="isDefault" className="ml-2 block text-sm text-white">
              Set as default Linktree
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500 bg-gray-800"
            />
            <label htmlFor="isPublic" className="ml-2 block text-sm text-white">
              Make this Linktree public
            </label>
            <div className="ml-2 group relative">
              <span className="text-gray-400 cursor-help">(?)</span>
              <div className="absolute bottom-full mb-2 hidden group-hover:block w-64 p-2 text-xs text-gray-300 bg-gray-800 rounded shadow-lg">
                Public Linktrees can be viewed by anyone with the link. Private Linktrees are only accessible when you're logged in.
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium backdrop-blur-md bg-white/5 border border-white/10 rounded-md shadow-sm text-gray-200 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Linktree'}
          </button>
        </div>
      </form>
    </div>
  );
} 