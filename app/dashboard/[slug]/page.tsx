'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { PencilIcon, TrashIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

interface Link {
  _id: string;
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

interface PageProps {
  params: {
    slug: string;
  };
}

export default function EditLinktree({ params }: PageProps) {
  const { data: session } = useSession();
  const [linktree, setLinktree] = useState<Linktree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: '',
    enabled: true,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetchLinktree();
  }, [params.slug]);

  const fetchLinktree = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/linktrees/${params.slug}`);
      if (!response.ok) {
        throw new Error('Failed to fetch Linktree');
      }
      const data = await response.json();
      setLinktree(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Linktree:', error);
      setError('Failed to load Linktree. Please try again.');
      setLoading(false);
    }
  };

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/linktrees/${params.slug}/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          order: linktree?.links.length || 0,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add link');
      }

      const updatedLinktree = await response.json();
      setLinktree(updatedLinktree);
      formRef.current?.reset();
      setFormData({
        title: '',
        url: '',
        icon: '',
        enabled: true,
      });
    } catch (error) {
      console.error('Error adding link:', error);
      setError('Failed to add link. Please try again.');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/linktrees/${params.slug}/links/${linkId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      const updatedLinktree = await response.json();
      setLinktree(updatedLinktree);
    } catch (error) {
      console.error('Error deleting link:', error);
      setError('Failed to delete link. Please try again.');
    }
  };

  const handleToggleLink = async (linkId: string, enabled: boolean) => {
    try {
      const response = await fetch(
        `/api/linktrees/${params.slug}/links/${linkId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled: !enabled }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update link');
      }

      const updatedLinktree = await response.json();
      setLinktree(updatedLinktree);
    } catch (error) {
      console.error('Error updating link:', error);
      setError('Failed to update link. Please try again.');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination || !linktree) return;

    const items = Array.from(linktree.links);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order property for each item
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    // Optimistically update the UI
    setLinktree({
      ...linktree,
      links: updatedItems,
    });

    try {
      const response = await fetch(
        `/api/linktrees/${params.slug}/links/reorder`,
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
        // If there's an error, we should revert the optimistic update
        // but for simplicity, we'll just refetch the linktree
        fetchLinktree();
      }
    } catch (error) {
      console.error('Error reordering links:', error);
      setError('Failed to reorder links. Please try again.');
      fetchLinktree();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!linktree) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded">
        Linktree not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">
          Edit Linktree: {linktree.title}
        </h1>
        <Link
          href={`/${linktree.slug}`}
          target="_blank"
          className="inline-flex items-center px-4 py-2 rounded-lg backdrop-blur-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 transform hover:scale-105"
        >
          <EyeIcon className="h-5 w-5 mr-2" />
          View Live
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
            <h2 className="text-xl font-medium text-white mb-4">Links</h2>
            {linktree.links.length === 0 ? (
              <p className="text-gray-400">No links added yet.</p>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="links">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {linktree.links
                        .sort((a, b) => a.order - b.order)
                        .map((link, index) => (
                          <Draggable
                            key={link._id}
                            draggableId={link._id}
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-4 rounded-lg ${
                                  link.enabled
                                    ? 'bg-gray-800'
                                    : 'bg-gray-900 opacity-60'
                                } flex justify-between items-center`}
                              >
                                <div>
                                  <h3 className="font-medium text-white">
                                    {link.title}
                                  </h3>
                                  <p className="text-sm text-gray-400">
                                    {link.url}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      handleToggleLink(link._id, link.enabled)
                                    }
                                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
                                  >
                                    {link.enabled ? (
                                      <EyeIcon className="h-5 w-5" />
                                    ) : (
                                      <EyeSlashIcon className="h-5 w-5" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLink(link._id)}
                                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-700"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
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
            )}
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <h2 className="text-xl font-medium text-white mb-4">Add New Link</h2>
          <form ref={formRef} onSubmit={handleLinkSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-white"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                name="url"
                required
                value={formData.url}
                onChange={(e) =>
                  setFormData({ ...formData, url: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="icon"
                className="block text-sm font-medium text-white"
              >
                Icon (optional)
              </label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-400">
                Enter an emoji or icon code
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                name="enabled"
                checked={formData.enabled}
                onChange={(e) =>
                  setFormData({ ...formData, enabled: e.target.checked })
                }
                className="h-4 w-4 rounded border-gray-700 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="enabled"
                className="ml-2 block text-sm text-white"
              >
                Enabled
              </label>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 