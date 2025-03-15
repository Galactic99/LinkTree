'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import QRCode from '@/app/components/QRCode';
import ShareButtons from '@/app/components/ShareButtons';
import EmbedCode from '@/app/components/EmbedCode';

interface Link {
  _id: string;
  title: string;
  url: string;
  icon?: string;
  enabled: boolean;
  order: number;
}

interface User {
  _id: string;
  name?: string;
  image?: string;
}

interface ABTest {
  _id: string;
  status: string;
  variants: {
    _id: string;
    title: string;
    url: string;
  }[];
}

interface LinktreeData {
  _id: string;
  title: string;
  theme: string;
  links: Link[];
  userId: User;
  isPublic: boolean;
  footer?: string;
  slug: string;
}

interface Props {
  linktree: LinktreeData;
}

const formatUsername = (name: string | undefined | null): string => {
  if (!name) return '';
  
  // Simple character-by-character approach to avoid complex string operations
  let result = '';
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    if (char !== ' ') {
      result += char.toLowerCase();
    }
  }
  return result;
};

export default function PublicLinktreeClient({ linktree }: Props) {
  const [abTests, setAbTests] = useState<Map<string, ABTest>>(new Map());
  const [showQR, setShowQR] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchABTests = async () => {
      // Fetch A/B tests for each link
      const testsMap = new Map<string, ABTest>();
      await Promise.all(
        linktree.links.map(async (link: Link) => {
          try {
            const testResponse = await fetch(`/api/ab-test-links/${link._id}`);
            if (testResponse.ok) {
              const testData = await testResponse.json();
              if (testData && testData.status === 'active') {
                testsMap.set(link._id, testData);
              }
            }
          } catch (err) {
            console.error(`Failed to fetch A/B test for link ${link._id}:`, err);
          }
        })
      );
      setAbTests(testsMap);
    };

    fetchABTests();
  }, [linktree.links]);

  const trackClick = async (linkId: string, variantId?: string) => {
    try {
      if (!linkId) {
        console.error('Missing linkId for tracking');
        return;
      }

      console.log('Tracking click for link:', linkId);
      
      // Track regular analytics
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linktreeId: linktree.slug,
          linkId,
          referrer: document.referrer,
        }),
      });
      
      const data = await response.json();
      console.log('Analytics tracking response:', data);

      // Track A/B test metrics if applicable
      if (variantId) {
        console.log('Tracking A/B test variant:', variantId);
        const test = abTests.get(linkId);
        if (test && test._id) {
          await fetch(`/api/ab-test-metrics/${test._id}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              variantId,
              type: 'click',
            }),
          });
        }
      }
    } catch (error) {
      console.error('Failed to track metrics:', error);
    }
  };

  const trackImpression = async (linkId: string, variantId: string) => {
    try {
      if (!linkId || !variantId) {
        console.error('Missing linkId or variantId for impression tracking');
        return;
      }

      const test = abTests.get(linkId);
      if (test && test._id) {
        await fetch(`/api/ab-test-metrics/${test._id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            variantId,
            type: 'impression',
          }),
        });
      }
    } catch (error) {
      console.error('Failed to track impression:', error);
    }
  };

  const getRandomVariant = (test: ABTest) => {
    if (!test || !Array.isArray(test.variants) || test.variants.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * test.variants.length);
    return test.variants[randomIndex];
  };

  // Filter out disabled links and sort by order
  const activeLinks = linktree.links
    .filter((link) => link.enabled)
    .sort((a, b) => a.order - b.order);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Something went wrong</h1>
          <p className="text-gray-300">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 transition-colors duration-200">
        <div className="max-w-3xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {linktree.userId.image && (
              <div className="flex justify-center">
                <div className="relative w-24 h-24">
                  <Image
                    src={linktree.userId.image}
                    alt={linktree.userId.name || 'Profile'}
                    fill
                    className="rounded-full object-cover border-4 border-white/10 shadow-lg"
                  />
                </div>
              </div>
            )}
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              {linktree.title}
            </h1>
            {linktree.userId.name && (
              <p className="text-lg text-gray-300">
                @{formatUsername(linktree.userId.name)}
              </p>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {showQR ? 'Hide QR Code' : 'Show QR Code'}
              </button>
              <button
                onClick={() => setShowEmbed(!showEmbed)}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {showEmbed ? 'Hide Embed Code' : 'Get Embed Code'}
              </button>
            </div>

            <ShareButtons url={pageUrl} title={linktree.title} />

            {showQR && (
              <div className="flex justify-center">
                <QRCode url={pageUrl} />
              </div>
            )}

            {showEmbed && (
              <div className="max-w-lg mx-auto">
                <EmbedCode url={pageUrl} title={linktree.title} />
              </div>
            )}
          </div>

          <div className="mt-12 space-y-4 max-w-lg mx-auto">
            {activeLinks.map((link) => {
              const test = abTests.get(link._id);
              let displayLink = link;

              if (test) {
                const variant = getRandomVariant(test);
                if (variant) {
                  displayLink = {
                    ...link,
                    title: variant.title || link.title,
                    url: variant.url || link.url,
                  };
                  // Track impression
                  trackImpression(link._id, variant._id);
                }
              }

              return (
                <a
                  key={link._id}
                  href={displayLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    const variant = test && test.variants && test.variants.length > 0 
                      ? test.variants[0] 
                      : null;
                    trackClick(link._id, variant?._id);
                  }}
                  className="group block w-full text-left px-6 py-4 rounded-xl backdrop-blur-lg bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] hover:-translate-y-1"
                >
                  <div className="flex items-center">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors duration-200">
                        {displayLink.title}
                      </h2>
                      <p className="mt-1 text-sm text-gray-400 truncate">
                        {displayLink.url}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors duration-200"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </a>
              );
            })}
          </div>

          {linktree.footer && (
            <footer className="mt-16 text-center text-sm text-gray-400">
              {linktree.footer}
            </footer>
          )}
        </div>
      </div>
    );
  } catch (err) {
    setError(err instanceof Error ? err : new Error('Unknown error'));
    return null;
  }
} 