'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  _id: string;
  linktreeId: string;
  linkId: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  country?: string;
  city?: string;
  referrer?: string;
}

interface LinktreeOption {
  _id: string;
  title: string;
}

export default function AnalyticsDashboard() {
  const { data: session } = useSession();
  const [linktrees, setLinktrees] = useState<LinktreeOption[]>([]);
  const [selectedLinktree, setSelectedLinktree] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLinktrees = async () => {
      try {
        const response = await fetch('/api/linktrees');
        if (!response.ok) throw new Error('Failed to fetch linktrees');
        const data = await response.json();
        setLinktrees(data);
        if (data.length > 0) setSelectedLinktree(data[0]._id);
      } catch (error) {
        console.error('Error fetching linktrees:', error);
      }
    };

    if (session) fetchLinktrees();
  }, [session]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedLinktree) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `/api/analytics?linktreeId=${selectedLinktree}&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
        );
        if (!response.ok) throw new Error('Failed to fetch analytics');
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedLinktree, dateRange]);

  // Process data for chart
  const chartData = {
    labels: analytics
      .map(a => new Date(a.timestamp).toLocaleDateString())
      .filter((date, index, self) => self.indexOf(date) === index),
    datasets: [{
      label: 'Clicks',
      data: analytics.reduce((acc: { [key: string]: number }, curr) => {
        const date = new Date(curr.timestamp).toLocaleDateString();
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {}),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
    }],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-white mb-8">Analytics Dashboard</h1>

      <div className="grid gap-6 mb-8">
        <div className="backdrop-blur-md bg-white/5 rounded-lg border border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Select Linktree
              </label>
              <select
                value={selectedLinktree}
                onChange={(e) => setSelectedLinktree(e.target.value)}
                className="w-full rounded-md border-gray-700 bg-gray-800 text-white focus:border-blue-500 focus:ring-blue-500"
              >
                {linktrees.map((tree) => (
                  <option key={tree._id} value={tree._id}>
                    {tree.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-md border-gray-700 bg-gray-800 text-white focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-md border-gray-700 bg-gray-800 text-white focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-white">Loading analytics data...</div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-lg p-4">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                      labels: {
                        color: 'white',
                      },
                    },
                    title: {
                      display: true,
                      text: 'Click Analytics',
                      color: 'white',
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                    y: {
                      ticks: { color: 'white' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    },
                  },
                }}
              />
            </div>
          )}
        </div>

        <div className="backdrop-blur-md bg-white/5 rounded-lg border border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Recent Clicks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Referrer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {analytics.map((click) => (
                  <tr key={click._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(click.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {click.city && click.country ? `${click.city}, ${click.country}` : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {click.referrer || 'Direct'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 