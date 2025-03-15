'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Domain {
  domain: string;
  verified: boolean;
  linktreeId: string;
}

interface Linktree {
  _id: string;
  title: string;
}

export default function DomainsPage() {
  const { data: session } = useSession();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [linktrees, setLinktrees] = useState<Linktree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [selectedLinktree, setSelectedLinktree] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [domainsRes, linktreesRes] = await Promise.all([
          fetch('/api/user/domains'),
          fetch('/api/linktrees'),
        ]);

        if (!domainsRes.ok || !linktreesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const [domainsData, linktreesData] = await Promise.all([
          domainsRes.json(),
          linktreesRes.json(),
        ]);

        setDomains(domainsData);
        setLinktrees(linktreesData);
        if (linktreesData.length > 0) {
          setSelectedLinktree(linktreesData[0]._id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session) fetchData();
  }, [session]);

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: newDomain,
          linktreeId: selectedLinktree,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add domain');
      }

      const newDomainData = await response.json();
      setDomains([...domains, newDomainData]);
      setNewDomain('');
      setSuccess('Domain added successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleVerifyDomain = async (domain: string) => {
    try {
      const response = await fetch(`/api/user/domains/${encodeURIComponent(domain)}/verify`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to verify domain');
      }

      const updatedDomain = await response.json();
      setDomains(domains.map(d => 
        d.domain === domain ? updatedDomain : d
      ));
      setSuccess('Domain verification started!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDeleteDomain = async (domain: string) => {
    try {
      const response = await fetch(`/api/user/domains/${encodeURIComponent(domain)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete domain');
      }

      setDomains(domains.filter(d => d.domain !== domain));
      setSuccess('Domain deleted successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-white mb-8">Custom Domains</h1>

      <div className="space-y-8">
        <div className="backdrop-blur-md bg-white/5 rounded-lg border border-white/10 p-6">
          <h2 className="text-xl font-medium text-white mb-4">Add New Domain</h2>

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

          <form onSubmit={handleAddDomain} className="space-y-4">
            <div>
              <label htmlFor="domain" className="block text-sm font-medium text-white">
                Domain Name
              </label>
              <input
                type="text"
                id="domain"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="linktree" className="block text-sm font-medium text-white">
                Select Linktree
              </label>
              <select
                id="linktree"
                value={selectedLinktree}
                onChange={(e) => setSelectedLinktree(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-700 bg-gray-800 text-white py-2 px-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {linktrees.map((tree) => (
                  <option key={tree._id} value={tree._id}>
                    {tree.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Domain
            </button>
          </form>
        </div>

        <div className="backdrop-blur-md bg-white/5 rounded-lg border border-white/10 p-6">
          <h2 className="text-xl font-medium text-white mb-4">Your Domains</h2>

          {domains.length === 0 ? (
            <p className="text-gray-400">No domains added yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Linktree
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {domains.map((domain) => (
                    <tr key={domain.domain}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {domain.domain}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            domain.verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {domain.verified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {linktrees.find(tree => tree._id === domain.linktreeId)?.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {!domain.verified && (
                          <button
                            onClick={() => handleVerifyDomain(domain.domain)}
                            className="text-blue-400 hover:text-blue-300 mr-4"
                          >
                            Verify
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDomain(domain.domain)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 