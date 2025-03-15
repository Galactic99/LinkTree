'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
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

interface Linktree {
  _id: string;
  title: string;
  slug: string;
  links: {
    _id: string;
    title: string;
    url: string;
    enabled: boolean;
  }[];
}

interface PageProps {
  params: {
    slug: string;
  };
}

export default function LinktreeAnalytics({ params }: PageProps) {
  const { data: session } = useSession();
  const [linktree, setLinktree] = useState<Linktree | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7days');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      if (loading && lastUpdated) return; // Prevent multiple simultaneous fetches
      setLoading(true);
      
      console.log('Fetching analytics data...');
      
      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      if (dateRange === '7days') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (dateRange === '30days') {
        startDate.setDate(endDate.getDate() - 30);
      } else if (dateRange === '90days') {
        startDate.setDate(endDate.getDate() - 90);
      }
      
      console.log('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
      
      // Fetch linktree details
      console.log('Fetching linktree details for slug:', params.slug);
      const linktreeResponse = await fetch(`/api/linktrees/${params.slug}`);
      if (!linktreeResponse.ok) {
        console.error('Failed to fetch linktree:', await linktreeResponse.text());
        throw new Error('Failed to fetch Linktree');
      }
      const linktreeData = await linktreeResponse.json();
      console.log('Linktree data:', linktreeData);
      setLinktree(linktreeData);
      
      // Fetch analytics data
      const analyticsUrl = `/api/analytics?linktreeId=${params.slug}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
      console.log('Fetching analytics from:', analyticsUrl);
      const analyticsResponse = await fetch(analyticsUrl);
      if (!analyticsResponse.ok) {
        console.error('Failed to fetch analytics:', await analyticsResponse.text());
        throw new Error('Failed to fetch analytics');
      }
      const analyticsData = await analyticsResponse.json();
      console.log('Analytics data received:', analyticsData.length, 'records');
      setAnalytics(analyticsData);
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load analytics data');
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [params.slug, dateRange]);
  
  // Set up auto-refresh interval
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchData();
      }, 30000); // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoRefresh, dateRange, params.slug]);

  // Prepare data for charts
  const prepareChartData = () => {
    if (!analytics.length || !linktree) return null;
    
    // Group by date
    const clicksByDate = {};
    const dateLabels = [];
    
    // Create date labels for the selected range
    const endDate = new Date();
    let startDate = new Date();
    
    if (dateRange === '7days') {
      startDate.setDate(endDate.getDate() - 7);
    } else if (dateRange === '30days') {
      startDate.setDate(endDate.getDate() - 30);
    } else if (dateRange === '90days') {
      startDate.setDate(endDate.getDate() - 90);
    }
    
    // Generate all dates in the range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateLabels.push(dateStr);
      clicksByDate[dateStr] = 0;
    }
    
    // Count clicks by date
    analytics.forEach(item => {
      const date = new Date(item.timestamp).toISOString().split('T')[0];
      if (clicksByDate[date] !== undefined) {
        clicksByDate[date]++;
      }
    });
    
    // Prepare data for line chart
    const lineChartData = {
      labels: dateLabels,
      datasets: [
        {
          label: 'Clicks',
          data: dateLabels.map(date => clicksByDate[date]),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
      ],
    };
    
    // Group by link
    const clicksByLink = {};
    const linkLabels = [];
    const linkColors = [];
    
    // Initialize with all links
    linktree.links.forEach((link, index) => {
      linkLabels.push(link.title);
      clicksByLink[link._id] = 0;
      
      // Generate colors
      const hue = (index * 137) % 360; // Golden angle approximation for good distribution
      linkColors.push(`hsl(${hue}, 70%, 60%)`);
    });
    
    // Count clicks by link
    analytics.forEach(item => {
      if (clicksByLink[item.linkId] !== undefined) {
        clicksByLink[item.linkId]++;
      }
    });
    
    // Prepare data for bar chart
    const barChartData = {
      labels: linkLabels,
      datasets: [
        {
          label: 'Clicks by Link',
          data: linktree.links.map(link => clicksByLink[link._id]),
          backgroundColor: linkColors,
        },
      ],
    };
    
    // Prepare data for pie chart
    const pieChartData = {
      labels: linkLabels,
      datasets: [
        {
          data: linktree.links.map(link => clicksByLink[link._id]),
          backgroundColor: linkColors,
        },
      ],
    };
    
    return {
      lineChartData,
      barChartData,
      pieChartData,
    };
  };
  
  const chartData = prepareChartData();
  
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
  
  const totalClicks = analytics.length;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">
          Analytics for {linktree.title}
        </h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="auto-refresh" className="mr-2 text-sm text-gray-300">
              Auto-refresh
            </label>
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="rounded text-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm flex items-center"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            ) : (
              <span>Refresh</span>
            )}
          </button>
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-1 text-sm"
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
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Clicks</p>
              <p className="text-2xl font-semibold text-white">{totalClicks}</p>
            </div>
          </div>
        </div>
        
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/10 text-green-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Active Links</p>
              <p className="text-2xl font-semibold text-white">
                {linktree.links.filter(link => link.enabled).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500/10 text-purple-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Avg. Clicks/Day</p>
              <p className="text-2xl font-semibold text-white">
                {totalClicks > 0 
                  ? (totalClicks / (dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90)).toFixed(1) 
                  : '0'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      {chartData && (
        <div className="space-y-6">
          <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
            <h2 className="text-xl font-medium text-white mb-4">Clicks Over Time</h2>
            <div className="h-64">
              <Line 
                data={chartData.lineChartData} 
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
                    legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                  }
                }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
              <h2 className="text-xl font-medium text-white mb-4">Clicks by Link</h2>
              <div className="h-64">
                <Bar 
                  data={chartData.barChartData} 
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
                      legend: { display: false }
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
              <h2 className="text-xl font-medium text-white mb-4">Distribution</h2>
              <div className="h-64 flex items-center justify-center">
                {totalClicks > 0 ? (
                  <Pie 
                    data={chartData.pieChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { 
                          position: 'right',
                          labels: { color: 'rgba(255, 255, 255, 0.7)' }
                        }
                      }
                    }}
                  />
                ) : (
                  <p className="text-gray-400">No data to display</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* No data message */}
      {(!chartData || totalClicks === 0) && (
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-white">No analytics data yet</h3>
          <p className="mt-2 text-gray-400">
            Share your Linktree to start collecting analytics data.
          </p>
        </div>
      )}
    </div>
  );
} 