import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Linktree from '@/app/models/Linktree';

// Add timeout to promises
const withTimeout = (promise, timeoutMs) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([
    promise,
    timeoutPromise
  ]).finally(() => clearTimeout(timeoutId));
};

export async function GET() {
  try {
    // Get session with timeout
    const sessionPromise = getServerSession(authOptions);
    const session = await withTimeout(sessionPromise, 5000);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

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
    const queryPromise = Linktree.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .select('title slug theme isDefault createdAt')
      .lean();
    
    const linktrees = await withTimeout(queryPromise, 5000);

    return NextResponse.json(linktrees);
  } catch (error) {
    console.error('Error fetching linktrees:', error);
    
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

export async function POST(request: Request) {
  try {
    // Get session with timeout
    const sessionPromise = getServerSession(authOptions);
    const session = await withTimeout(sessionPromise, 5000);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, slug, theme, isDefault, isPublic, footer } = body;

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { error: 'Title and slug are required.' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      );
    }

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

    // Check if slug is already taken
    const existingLinktree = await Linktree.findOne({ slug }).lean();
    if (existingLinktree) {
      return NextResponse.json(
        { error: 'This URL slug is already taken.' },
        { status: 400 }
      );
    }

    // If this is set as default, unset any existing default
    if (isDefault) {
      await Linktree.updateMany(
        { userId: session.user.id, isDefault: true },
        { isDefault: false }
      );
    }

    // Create the new Linktree
    const linktree = await Linktree.create({
      userId: session.user.id,
      title,
      slug,
      theme: theme || 'light',
      isDefault,
      isPublic: isPublic !== undefined ? isPublic : true,
      footer: footer || '',
      links: [],
    });

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error creating linktree:', error);
    
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