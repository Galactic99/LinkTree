import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Linktree from '@/app/models/Linktree';
import PublicLinktreeClient from './PublicLinktreeClient';

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
  footer?: string;
}

interface MongoLinktree {
  _id: { toString(): string };
  title?: string;
  theme?: string;
  links?: Array<{
    _id: { toString(): string };
    title: string;
    url: string;
    icon?: string;
    enabled: boolean;
    order: number;
  }>;
  userId: {
    _id: { toString(): string };
    name?: string;
    image?: string;
  };
  isPublic?: boolean;
  footer?: string;
}

async function getLinktree(slug: string): Promise<LinktreeData | null> {
  try {
    await connectDB();
    // Use any type to avoid TypeScript errors with Mongoose's lean() output
    const linktree: any = await Linktree.findOne({ slug }).populate('userId').lean();
    
    if (!linktree) return null;

    // Safely access potentially undefined properties
    const safeId = linktree._id ? linktree._id.toString() : '';
    const safeLinks = Array.isArray(linktree.links) ? linktree.links : [];
    
    // Handle case where userId might be undefined or not properly populated
    const userId = linktree.userId || {};
    const safeUserId = userId._id ? userId._id.toString() : '';
    
    // Ensure all required fields are present and properly formatted
    return {
      _id: safeId,
      title: linktree.title || '',
      theme: linktree.theme || 'dark',
      links: safeLinks.map((link: any) => ({
        _id: link._id ? link._id.toString() : '',
        title: link.title || '',
        url: link.url || '',
        icon: link.icon,
        enabled: !!link.enabled,
        order: typeof link.order === 'number' ? link.order : 0
      })),
      userId: {
        _id: safeUserId,
        name: userId.name || '',
        image: userId.image || ''
      },
      isPublic: !!linktree.isPublic,
      footer: linktree.footer || ''
    };
  } catch (error) {
    console.error('Error fetching linktree:', error);
    return null;
  }
}

export default async function PublicLinktreePage({
  params,
}: {
  params: { slug: string };
}) {
  try {
    const session = await getServerSession(authOptions);
    const linktree = await getLinktree(params.slug);

    if (!linktree) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Not Found</h1>
            <p className="text-gray-300">This Linktree does not exist.</p>
          </div>
        </div>
      );
    }

    if (!linktree.isPublic && (!session || session.user.id !== linktree.userId._id)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Private Linktree</h1>
            <p className="text-gray-300">This Linktree is private.</p>
          </div>
        </div>
      );
    }

    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">Loading...</h1>
            </div>
          </div>
        }
      >
        <PublicLinktreeClient linktree={linktree} />
      </Suspense>
    );
  } catch (error) {
    console.error('Error in PublicLinktreePage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-purple-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Error</h1>
          <p className="text-gray-300">Something went wrong. Please try again later.</p>
        </div>
      </div>
    );
  }
} 