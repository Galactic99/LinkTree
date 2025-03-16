'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ShareButtons from '@/app/components/ShareButtons';

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

interface LinktreeData {
  _id: string;
  title: string;
  theme: string;
  links: Link[];
  userId: User;
  isPublic: boolean;
  footer: string;
  slug: string;
}

// Optimized username formatting function
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

export default function PublicLinktreeClientWrapper({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const [linktree, setLinktree] = useState<LinktreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  // Track click function
  const trackClick = async (linkId: string) => {
    try {
      console.log('Tracking click for link:', linkId);
      const response = await fetch('/api/public/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linktreeId: slug,
          linkId,
          referrer: document.referrer,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to track click');
      }

      const data = await response.json();
      console.log('Analytics tracking response:', data);
    } catch (error) {
      console.error('Failed to track click:', error);
      // Don't block the user experience for analytics errors
    }
  };

  useEffect(() => {
    const fetchLinktree = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Add timeout to fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const response = await fetch(`/api/public/linktrees/${slug}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Linktree not found');
          } else if (response.status === 504) {
            throw new Error('Request timed out. Please try again later.');
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch linktree');
          }
        }
        
        const data = await response.json();
        setLinktree(data);
      } catch (err) {
        console.error('Error fetching linktree:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLinktree();
  }, [slug]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-white">Loading your Linktree...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
        <div className="p-6 bg-red-100 border border-red-300 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!linktree) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
        <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Not Found</h2>
          <p className="text-gray-700">The linktree you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  // Check if linktree is private and user is not authorized
  if (!linktree.isPublic && (!session || session.user.id !== linktree.userId._id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
        <div className="p-6 bg-gray-100 border border-gray-300 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-gray-700 mb-2">Private Linktree</h2>
          <p className="text-gray-700">This Linktree is private and you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  // Render the linktree
  const themeClass = linktree.theme === 'dark' 
    ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 text-white' 
    : 'bg-gradient-to-br from-blue-50 via-white to-pink-50 text-gray-900';

  return (
    <div className={`min-h-screen flex flex-col items-center p-4 ${themeClass}`}>
      <div className="w-full max-w-md mx-auto">
        {/* User Profile */}
        <div className="flex flex-col items-center mb-8">
          {linktree.userId.image && (
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
              <img 
                src={linktree.userId.image} 
                alt={linktree.userId.name || 'User'} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold mb-1">{linktree.title}</h1>
          {linktree.userId.name && (
            <p className="text-lg text-gray-300">
              @{formatUsername(linktree.userId.name)}
            </p>
          )}
          
          {/* QR Code and Embed Buttons */}
          <div className="flex space-x-2 mt-2">
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              {showQR ? 'Hide QR' : 'Show QR'}
            </button>
            <button
              onClick={() => setShowEmbed(!showEmbed)}
              className="px-3 py-1 text-sm bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              {showEmbed ? 'Hide Embed' : 'Embed'}
            </button>
          </div>
          
          {/* QR Code Display */}
          {showQR && (
            <div className="mt-4 p-4 bg-white rounded-lg">
              <QRCode url={`${window.location.origin}/${slug}`} />
            </div>
          )}
          
          {/* Embed Code Display */}
          {showEmbed && (
            <div className="mt-4 w-full">
              <EmbedCode slug={slug} />
            </div>
          )}
        </div>
        
        {/* Links */}
        <div className="space-y-3 w-full">
          {linktree.links
            .filter(link => link.enabled)
            .sort((a, b) => a.order - b.order)
            .map(link => (
              <a
                key={link._id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick(link._id)}
                className={`block w-full p-3 rounded-lg text-center transition-transform transform hover:scale-105 ${
                  linktree.theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-white hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {link.icon && (
                  <span className="mr-2">{link.icon}</span>
                )}
                {link.title}
              </a>
            ))}
        </div>
        
        {/* Create Your Own Button (for non-registered users) */}
        {!session && (
          <div className="mt-8 text-center">
            <a
              href="/auth/signin"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 transform hover:scale-105"
            >
              Create Your Own Linktree
            </a>
          </div>
        )}
        
        {/* Footer */}
        {linktree.footer && (
          <div className="mt-8 text-center">
            <p className={`text-sm ${linktree.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {linktree.footer}
            </p>
          </div>
        )}
        
        {/* Share Buttons */}
        <div className="mt-8">
          <ShareButtons url={`${window.location.origin}/${slug}`} title={linktree.title} />
        </div>
      </div>
    </div>
  );
}

// Replace the placeholder components with proper implementations
const QRCode = ({ url }: { url: string }) => {
  return (
    <div className="text-center">
      <p className="text-black mb-2">Scan this QR code:</p>
      <div className="bg-gray-200 p-4 inline-block">
        <p className="text-xs text-gray-600">[QR Code for {url}]</p>
      </div>
    </div>
  );
};

const EmbedCode = ({ slug }: { slug: string }) => {
  const embedCode = `<iframe src="${window.location.origin}/${slug}" width="100%" height="600" frameborder="0"></iframe>`;
  
  return (
    <div className="bg-gray-800 p-3 rounded">
      <p className="text-white text-sm mb-2">Copy this code to embed your Linktree:</p>
      <textarea 
        className="w-full p-2 text-xs bg-gray-900 text-white rounded" 
        rows={3} 
        readOnly 
        value={embedCode}
        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
      />
    </div>
  );
}; 