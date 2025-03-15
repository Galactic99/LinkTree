'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900 relative">
      <div className="absolute top-6 left-6">
        <Link 
          href="/"
          className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        >
          LinkTree
        </Link>
      </div>
      
      <div className="max-w-md w-full space-y-8 p-8 backdrop-blur-lg bg-white/5 rounded-xl border border-white/10 shadow-2xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Authentication Error</h1>
          <p className="text-gray-300 mb-6">
            {error || 'An error occurred during authentication'}
          </p>
          <div className="mt-8">
            <Link
              href="/auth/signin"
              className="inline-flex items-center px-6 py-3 rounded-lg backdrop-blur-md bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium transition-all duration-200"
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 