import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Linktree from '@/app/models/Linktree';

// Add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
};

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Connect to database with timeout
    try {
      const dbPromise = connectDB();
      await withTimeout(dbPromise, 5000);
    } catch (dbError) {
      console.error('MongoDB connection error:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }

    // Find the linktree
    const linktree = await withTimeout(
      Linktree.findOne({ slug: params.slug })
        .populate('userId', 'name image')
        .lean(),
      5000
    );

    if (!linktree) {
      return NextResponse.json(
        { error: 'Linktree not found' },
        { status: 404 }
      );
    }

    // Check access permissions
    if (!linktree.isPublic) {
      // For private linktrees, check if user is logged in and owns the linktree
      if (!session || session.user.id !== linktree.userId._id.toString()) {
        return NextResponse.json(
          { error: 'This linktree is private' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error fetching linktree:', error);
    
    // Determine error type
    if (error instanceof Error) {
      if (error.message.includes('timed out')) {
        return NextResponse.json(
          { error: 'Request timed out. Please try again later.' },
          { status: 504 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 