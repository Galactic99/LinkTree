'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

const features = [
  {
    name: 'Custom Domain',
    free: false,
    premium: true,
    description: 'Use your own domain for your Linktree',
  },
  {
    name: 'A/B Testing',
    free: false,
    premium: true,
    description: 'Test different versions of your links to optimize clicks',
  },
  {
    name: 'Advanced Analytics',
    free: false,
    premium: true,
    description: 'Detailed insights into visitor behavior and demographics',
  },
  {
    name: 'Custom Themes',
    free: false,
    premium: true,
    description: 'Create and save custom themes for your Linktree',
  },
  {
    name: 'Basic Links',
    free: true,
    premium: true,
    description: 'Add unlimited links to your Linktree',
  },
  {
    name: 'Basic Analytics',
    free: true,
    premium: true,
    description: 'View basic click statistics',
  },
];

export default function PremiumPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');

    try {
      // In a real application, this would integrate with a payment provider
      const response = await fetch('/api/user/premium', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process subscription');
      }

      await update(); // Update session to reflect premium status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Upgrade to Premium
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Get access to advanced features and take your Linktree to the next level
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Free</h2>
          <p className="text-4xl font-bold text-white mb-8">$0</p>
          <ul className="space-y-4 mb-8">
            {features.map((feature) => (
              <li
                key={feature.name}
                className={`flex items-center ${
                  feature.free ? 'text-white' : 'text-gray-400'
                }`}
              >
                <svg
                  className={`w-5 h-5 mr-3 ${
                    feature.free ? 'text-green-400' : 'text-gray-500'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {feature.free ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  )}
                </svg>
                <span>{feature.name}</span>
              </li>
            ))}
          </ul>
          <button
            disabled
            className="w-full px-6 py-3 text-sm font-medium text-white bg-gray-600 rounded-md opacity-50 cursor-not-allowed"
          >
            Current Plan
          </button>
        </div>

        <div className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24">
            <div className="absolute transform rotate-45 bg-blue-600 text-white text-xs font-semibold py-1 right-[-35px] top-[32px] w-[170px] text-center">
              RECOMMENDED
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-6">Premium</h2>
          <p className="text-4xl font-bold text-white mb-8">
            $9.99
            <span className="text-lg font-normal text-gray-300">/month</span>
          </p>
          <ul className="space-y-4 mb-8">
            {features.map((feature) => (
              <li
                key={feature.name}
                className={`flex items-center ${
                  feature.premium ? 'text-white' : 'text-gray-400'
                }`}
              >
                <svg
                  className={`w-5 h-5 mr-3 ${
                    feature.premium ? 'text-green-400' : 'text-gray-500'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span>{feature.name}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upgrade Now'}
          </button>
          {error && (
            <p className="mt-4 text-sm text-red-400 text-center">{error}</p>
          )}
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400">
          All prices are in USD. Cancel anytime.
          <br />
          Questions? Contact our support team.
        </p>
      </div>
    </div>
  );
} 