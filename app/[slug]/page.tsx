import { Suspense } from 'react';
import PublicLinktreeClientWrapper from './PublicLinktreeClientWrapper';

interface PageProps {
  params: {
    slug: string;
  };
}

export default function PublicLinktreePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Loading...</h1>
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      }
    >
      <PublicLinktreeClientWrapper slug={params.slug} />
    </Suspense>
  );
} 