import { NextResponse } from 'next/server';
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

    // Execute query with timeout
    const queryPromise = Linktree.findOne({
      slug: params.slug,
      isPublic: true, // Only return public linktrees
    }).populate('userId', 'name image').lean();
    
    const linktree = await withTimeout(queryPromise, 5000);

    if (!linktree) {
      return NextResponse.json(
        { error: 'Linktree not found or is private' },
        { status: 404 }
      );
    }

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error fetching public linktree:', error);
    
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