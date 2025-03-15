'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon,
  GlobeAltIcon,
  EyeIcon,
  EyeSlashIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

interface Link {
  _id?: string;
  title: string;
  url: string;
  icon?: string;
  enabled: boolean;
  order: number;
}

interface Linktree {
  _id: string;
  title: string;
  slug: string;
  theme: string;
  isDefault: boolean;
  links: Link[];
}

export default function EditLinktree({ params }: { params: { linktreeId: string } }) {
  const router = useRouter();
  const [linktree, setLinktree] = useState<Linktree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkFormData, setLinkFormData] = useState<Link>({
    title: '',
    url: '',
    enabled: true,
    order: 0,
  });

  useEffect(() => {
    fetchLinktree();
  }, []);

  const fetchLinktree = async () => {
    try {
      const response = await fetch(`/api/linktrees/${params.linktreeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Linktree');
      }
      const data = await response.json();
      setLinktree(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linktree) return;

    try {
      const response = await fetch(`/api/linktrees/${params.linktreeId}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...linkFormData,
          order: linktree.links.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add link');
      }

      const updatedLinktree = await response.json();
      setLinktree(updatedLinktree);
      resetLinkForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!linktree) return;

    try {
      const response = await fetch(
        `/api/linktrees/${params.linktreeId}/links/${linkId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      const updatedLinktree = await response.json();
      setLinktree(updatedLinktree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleLink = async (linkId: string, enabled: boolean) => {
    if (!linktree) return;

    try {
      const response = await fetch(
        `/api/linktrees/${params.linktreeId}/links/${linkId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update link');
      }

      const updatedLinktree = await response.json();
      setLinktree(updatedLinktree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !linktree) return;

    const items = Array.from(linktree.links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    try {
      const response = await fetch(
        `/api/linktrees/${params.linktreeId}/links/reorder`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ links: updatedItems }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reorder links');
      }

      const updatedLinktree = await response.json();
      setLinktree(updatedLinktree);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const resetLinkForm = () => {
    setLinkFormData({ title: '', url: '', enabled: true, order: 0 });
    setEditingLink(null);
    setShowLinkForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!linktree) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-white">
          Linktree not found
        </h3>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-white">
          Edit {linktree.title}
        </h1>
        <a
          href={`/${linktree.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Live
        </a>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-500 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-white"
              >
                Link Title
              </label>
              <input
                type="text"
                id="title"
                value={linkFormData.title}
                onChange={(e) =>
                  setLinkFormData({ ...linkFormData, title: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-white"
              >
                URL
              </label>
              <input
                type="url"
                id="url"
                value={linkFormData.url}
                onChange={(e) => setLinkFormData({ ...linkFormData, url: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Link
            </button>
          </div>
        </form>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="links">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {linktree.links
                  .sort((a, b) => a.order - b.order)
                  .map((link, index) => (
                    <Draggable
                      key={link._id}
                      draggableId={link._id || ''}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="group block w-full text-left px-6 py-4 rounded-xl backdrop-blur-lg bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h2 className="text-lg font-semibold text-white">
                                {link.title}
                              </h2>
                              <p className="mt-1 text-sm text-gray-400 truncate">
                                {link.url}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <button
                                onClick={() =>
                                  handleToggleLink(link._id!, !link.enabled)
                                }
                                className={`px-3 py-1 text-xs font-medium rounded-full ${
                                  link.enabled
                                    ? 'bg-green-400/10 text-green-400 border border-green-400/20'
                                    : 'bg-red-400/10 text-red-400 border border-red-400/20'
                                }`}
                              >
                                {link.enabled ? 'Active' : 'Inactive'}
                              </button>
                              <button
                                onClick={() => handleDeleteLink(link._id!)}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
} 