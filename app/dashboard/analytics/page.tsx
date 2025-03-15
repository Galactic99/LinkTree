'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  ArrowUpIcon, 
  ArrowDownIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

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
  slug: string;
  totalClicks: number;
  clicksToday: number;
  clicksYesterday: number;
  percentChange: number;
}

export default function AnalyticsDashboard() {
  const [linktrees, setLinktrees] = useState<LinktreeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalClicks, setTotalClicks] = useState(0);
  const [dateRange, setDateRange] = useState('7days');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all linktrees
        const linktreesResponse = await fetch('/api/linktrees');
        if (!linktreesResponse.ok) throw new Error('Failed to fetch Linktrees');
        const linktreesData = await linktreesResponse.json();

        // Calculate date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const startDate = new Date(today);
        switch (dateRange) {
          case '7days':
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30days':
            startDate.setDate(startDate.getDate() - 30);
            break;
          case '90days':
            startDate.setDate(startDate.getDate() - 90);
            break;
          default:
            startDate.setDate(startDate.getDate() - 7);
        }

        // Process each linktree
        const linktreePromises = linktreesData.map(async (linktree: any) => {
          try {
            // Fetch analytics for this linktree
            const analyticsResponse = await fetch(
              `/api/analytics?linktreeId=${linktree._id}&startDate=${startDate.toISOString()}`
            );
            if (!analyticsResponse.ok) return null;
            const analyticsData: AnalyticsData[] = await analyticsResponse.json();
            
            // Calculate metrics
            const totalClicks = analyticsData.length;
            
            const clicksToday = analyticsData.filter(item => {
              const timestamp = new Date(item.timestamp);
              return timestamp >= today;
            }).length;
            
            const clicksYesterday = analyticsData.filter(item => {
              const timestamp = new Date(item.timestamp);
              return timestamp >= yesterday && timestamp < today;
            }).length;
            
            const percentChange = clicksYesterday > 0 
              ? ((clicksToday - clicksYesterday) / clicksYesterday) * 100 
              : clicksToday > 0 ? 100 : 0;
            
            return {
              _id: linktree._id,
              title: linktree.title,
              slug: linktree.slug,
              totalClicks,
              clicksToday,
              clicksYesterday,
              percentChange
            };
          } catch (err) {
            console.error(`Error fetching analytics for linktree ${linktree._id}:`, err);
            return null;
          }
        });
        
        const results = await Promise.all(linktreePromises);
        const validResults = results.filter(Boolean) as LinktreeOption[];
        
        // Calculate total clicks across all linktrees
        const allClicks = validResults.reduce((sum, item) => sum + item.totalClicks, 0);
        
        setLinktrees(validResults);
        setTotalClicks(allClicks);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange]);

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Analytics Dashboard</h1>
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
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500/20 text-blue-500">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-300">Total Clicks</h3>
              <p className="text-3xl font-bold text-white mt-1">{totalClicks}</p>
            </div>
          </div>
        </div>
        
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500/20 text-purple-500">
              <ChartPieIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-300">Active Linktrees</h3>
              <p className="text-3xl font-bold text-white mt-1">{linktrees.length}</p>
            </div>
          </div>
        </div>
        
        <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500/20 text-green-500">
              <ArrowTrendingUpIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-300">Today's Clicks</h3>
              <p className="text-3xl font-bold text-white mt-1">
                {linktrees.reduce((sum, item) => sum + item.clicksToday, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Linktrees Table */}
      <div className="backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-white">Linktree Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Linktree
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Total Clicks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Today
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Yesterday
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {linktrees.length > 0 ? (
                linktrees
                  .sort((a, b) => b.totalClicks - a.totalClicks)
                  .map((linktree) => (
                    <tr key={linktree._id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {linktree.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {linktree.totalClicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {linktree.clicksToday}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {linktree.clicksYesterday}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {linktree.percentChange > 0 ? (
                            <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                          ) : linktree.percentChange < 0 ? (
                            <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1" />
                          ) : (
                            <span className="h-4 w-4 inline-block mr-1" />
                          )}
                          <span
                            className={
                              linktree.percentChange > 0
                                ? 'text-green-500'
                                : linktree.percentChange < 0
                                ? 'text-red-500'
                                : 'text-gray-400'
                            }
                          >
                            {Math.abs(linktree.percentChange).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <Link
                          href={`/dashboard/analytics/${linktree._id}`}
                          className="text-blue-500 hover:text-blue-400 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-400">
                    No analytics data available
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