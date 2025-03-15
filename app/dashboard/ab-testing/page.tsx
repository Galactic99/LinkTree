'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Variant {
  title: string;
  url: string;
  impressions: number;
  clicks: number;
}

interface ABTest {
  _id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  variants: Variant[];
  linktreeId: string;
  linkId: string;
}

interface Linktree {
  _id: string;
  title: string;
  links: {
    _id: string;
    title: string;
    url: string;
  }[];
}

export default function ABTestingPage() {
  const { data: session } = useSession();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [linktrees, setLinktrees] = useState<Linktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedLinktree, setSelectedLinktree] = useState('');
  const [selectedLink, setSelectedLink] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    variants: [
      { title: '', url: '' },
      { title: '', url: '' },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, linktreesRes] = await Promise.all([
          fetch('/api/ab-tests'),
          fetch('/api/linktrees'),
        ]);

        if (!testsRes.ok || !linktreesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [testsData, linktreesData] = await Promise.all([
          testsRes.json(),
          linktreesRes.json(),
        ]);

        setTests(testsData);
        setLinktrees(linktreesData);
        if (linktreesData.length > 0) {
          setSelectedLinktree(linktreesData[0]._id);
          if (linktreesData[0].links.length > 0) {
            setSelectedLink(linktreesData[0].links[0]._id);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchData();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          linktreeId: selectedLinktree,
          linkId: selectedLink,
          startDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create A/B test');
      }

      const newTest = await response.json();
      setTests([...tests, newTest]);
      setFormData({
        name: '',
        variants: [
          { title: '', url: '' },
          { title: '', url: '' },
        ],
      });
      setSuccess('A/B test created successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateStatus = async (testId: string, status: string) => {
    try {
      const response = await fetch(`/api/ab-tests/${testId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update test status');
      }

      const updatedTest = await response.json();
      setTests(tests.map(test => 
        test._id === testId ? updatedTest : test
      ));
      setSuccess('Test status updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const calculateConversionRate = (variant: Variant) => {
    if (variant.impressions === 0) return 0;
    return ((variant.clicks / variant.impressions) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-white mb-8">A/B Testing</h1>

      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/5 rounded-lg border border-white/10 p-6">
          <h2 className="text-xl font-medium text-white mb-4">Create New Test</h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white">
                Test Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="linktree" className="block text-sm font-medium text-white">
                Select Linktree
              </label>
              <select
                id="linktree"
                value={selectedLinktree}
                onChange={(e) => {
                  setSelectedLinktree(e.target.value);
                  const tree = linktrees.find(t => t._id === e.target.value);
                  if (tree?.links.length > 0) {
                    setSelectedLink(tree.links[0]._id);
                  }
                }}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                {linktrees.map((tree) => (
                  <option key={tree._id} value={tree._id}>
                    {tree.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="link" className="block text-sm font-medium text-white">
                Select Link
              </label>
              <select
                id="link"
                value={selectedLink}
                onChange={(e) => setSelectedLink(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                {linktrees
                  .find(tree => tree._id === selectedLinktree)
                  ?.links.map((link) => (
                    <option key={link._id} value={link._id}>
                      {link.title}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-white">
                Variants
              </label>
              {formData.variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400">Title</label>
                    <input
                      type="text"
                      value={variant.title}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].title = e.target.value;
                        setFormData({ ...formData, variants: newVariants });
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">URL</label>
                    <input
                      type="url"
                      value={variant.url}
                      onChange={(e) => {
                        const newVariants = [...formData.variants];
                        newVariants[index].url = e.target.value;
                        setFormData({ ...formData, variants: newVariants });
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Test
              </button>
            </div>
          </form>
        </div>

        <div className="backdrop-blur-md bg-white/5 rounded-lg border border-white/10 p-6">
          <h2 className="text-xl font-medium text-white mb-4">Active Tests</h2>

          {tests.length === 0 ? (
            <p className="text-gray-400">No A/B tests found.</p>
          ) : (
            <div className="space-y-6">
              {tests.map((test) => (
                <div
                  key={test._id}
                  className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">{test.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          test.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : test.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {test.status}
                      </span>
                      <select
                        value={test.status}
                        onChange={(e) => handleUpdateStatus(test._id, e.target.value)}
                        className="text-sm rounded-md border border-gray-700 bg-gray-800 text-white py-1 px-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {test.variants.map((variant, index) => (
                      <div
                        key={index}
                        className="bg-gray-900/50 rounded p-4 border border-gray-700"
                      >
                        <h4 className="font-medium text-white mb-2">
                          Variant {index + 1}: {variant.title}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-400">
                            Impressions: {variant.impressions}
                          </p>
                          <p className="text-gray-400">
                            Clicks: {variant.clicks}
                          </p>
                          <p className="text-gray-400">
                            Conversion Rate: {calculateConversionRate(variant)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-sm text-gray-400">
                    Started: {new Date(test.startDate).toLocaleDateString()}
                    {test.endDate && ` • Ended: ${new Date(test.endDate).toLocaleDateString()}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 