'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
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

interface LinkData {
  _id: string;
  title: string;
  url: string;
  clicks: number;
}

interface LinktreeData {
  _id: string;
  title: string;
  slug: string;
}

export default function LinktreeAnalytics({ params }: { params: { linktreeId: string } }) {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [linktree, setLinktree] = useState<LinktreeData | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7days');
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch linktree details
        const linktreeResponse = await fetch(`/api/linktrees/${params.linktreeId}`);
        if (!linktreeResponse.ok) throw new Error('Failed to fetch Linktree');
        const linktreeData = await linktreeResponse.json();
        setLinktree(linktreeData);

        // Calculate date range
        const endDate = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case '7days':
            startDate.setDate(endDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(endDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(endDate.getDate() - 90);
            break;
          default:
            startDate.setDate(endDate.getDate() - 7);
        }

        // Fetch analytics data
        const analyticsResponse = await fetch(
          `/api/analytics?linktreeId=${params.linktreeId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        );
        if (!analyticsResponse.ok) throw new Error('Failed to fetch analytics');
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);

        // Process link data
        const linkMap = new Map<string, LinkData>();
        
        // Initialize with links from the linktree
        linktreeData.links.forEach((link: any) => {
          linkMap.set(link._id, {
            _id: link._id,
            title: link.title,
            url: link.url,
            clicks: 0
          });
        });
        
        // Count clicks for each link
        analyticsData.forEach((item: AnalyticsData) => {
          const link = linkMap.get(item.linkId);
          if (link) {
            link.clicks += 1;
          } else {
            // Handle clicks for links that might have been deleted
            linkMap.set(item.linkId, {
              _id: item.linkId,
              title: 'Deleted Link',
              url: '',
              clicks: 1
            });
          }
        });
        
        const processedLinks = Array.from(linkMap.values());
        setLinks(processedLinks);
        setTotalClicks(analyticsData.length);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.linktreeId, dateRange]);

  // Prepare data for charts
  const prepareTimeSeriesData = () => {
    const dateMap = new Map<string, number>();
    const now = new Date();
    const days = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
    
    // Initialize all dates with 0 clicks
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }
    
    // Count clicks per day
    analytics.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      if (dateMap.has(date)) {
        dateMap.set(date, (dateMap.get(date) || 0) + 1);
      }
    });
    
    // Sort dates chronologically
    const sortedDates = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));
    
    return {
      labels: sortedDates.map(([date]) => date),
      datasets: [
        {
          label: 'Clicks',
          data: sortedDates.map(([, count]) => count),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };

  const prepareLinkClicksData = () => {
    const sortedLinks = [...links].sort((a, b) => b.clicks - a.clicks);
    const topLinks = sortedLinks.slice(0, 10); // Show top 10 links
    
    return {
      labels: topLinks.map(link => link.title),
      datasets: [
        {
          label: 'Clicks',
          data: topLinks.map(link => link.clicks),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(199, 199, 199, 0.7)',
            'rgba(83, 102, 255, 0.7)',
            'rgba(40, 159, 64, 0.7)',
            'rgba(210, 199, 199, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(40, 159, 64, 1)',
            'rgba(210, 199, 199, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const prepareReferrerData = () => {
    const referrerMap = new Map<string, number>();
    
    // Count clicks per referrer
    analytics.forEach(item => {
      const referrer = item.referrer ? new URL(item.referrer).hostname : 'Direct';
      referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);
    });
    
    // Sort referrers by click count
    const sortedReferrers = Array.from(referrerMap.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return {
      labels: sortedReferrers.map(([referrer]) => referrer),
      datasets: [
        {
          label: 'Referrers',
          data: sortedReferrers.map(([, count]) => count),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-300" />
          </button>
          <h1 className="text-2xl font-semibold text-white">
            Analytics for {linktree?.title}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <h3 className="text-lg font-medium text-gray-300">Total Clicks</h3>
          <p className="text-3xl font-bold text-white mt-2">{totalClicks}</p>
        </div>
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <h3 className="text-lg font-medium text-gray-300">Unique Links</h3>
          <p className="text-3xl font-bold text-white mt-2">{links.length}</p>
        </div>
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <h3 className="text-lg font-medium text-gray-300">Average Daily Clicks</h3>
          <p className="text-3xl font-bold text-white mt-2">
            {totalClicks > 0 
              ? Math.round(totalClicks / (dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90)) 
              : 0}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="space-y-6">
        {/* Time Series Chart */}
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">Clicks Over Time</h3>
          <div className="h-80">
            {analytics.length > 0 ? (
              <Line 
                data={prepareTimeSeriesData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    },
                    x: {
                      ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                    }
                  },
                  plugins: {
                    legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      titleColor: 'rgba(255, 255, 255, 1)',
                      bodyColor: 'rgba(255, 255, 255, 1)'
                    }
                  }
                }}
              />
            ) : (
              <div className="flex justify-center items-center h-full text-gray-400">
                No data available for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Link Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Top Links</h3>
            <div className="h-80">
              {links.length > 0 ? (
                <Bar 
                  data={prepareLinkClicksData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                      y: {
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                      },
                      x: {
                        beginAtZero: true,
                        ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' }
                      }
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 1)'
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex justify-center items-center h-full text-gray-400">
                  No data available for the selected period
                </div>
              )}
            </div>
          </div>

          {/* Referrers */}
          <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
            <h3 className="text-lg font-medium text-white mb-4">Traffic Sources</h3>
            <div className="h-80">
              {analytics.length > 0 ? (
                <Pie 
                  data={prepareReferrerData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'right',
                        labels: { color: 'rgba(255, 255, 255, 0.7)' }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        titleColor: 'rgba(255, 255, 255, 1)',
                        bodyColor: 'rgba(255, 255, 255, 1)'
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex justify-center items-center h-full text-gray-400">
                  No data available for the selected period
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Link Analytics Table */}
      <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4">Link Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {links.length > 0 ? (
                links
                  .sort((a, b) => b.clicks - a.clicks)
                  .map((link) => (
                    <tr key={link._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {link.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {link.url.length > 40 ? `${link.url.substring(0, 40)}...` : link.url}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {link.clicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {totalClicks > 0 ? `${((link.clicks / totalClicks) * 100).toFixed(1)}%` : '0%'}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-400">
                    No data available for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 