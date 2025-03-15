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

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
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
    const { title, url, enabled, order, icon } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required.' },
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

    const linktree = await Linktree.findOne({
      slug: params.slug,
      userId: session.user.id,
    });

    if (!linktree) {
      return NextResponse.json(
        { error: 'Linktree not found' },
        { status: 404 }
      );
    }

    linktree.links.push({
      title,
      url,
      enabled: enabled !== undefined ? enabled : true,
      order: order !== undefined ? order : linktree.links.length,
      icon,
    });

    await linktree.save();

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error adding link:', error);
    
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

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
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
    const { links } = body;

    if (!links || !Array.isArray(links)) {
      return NextResponse.json(
        { error: 'Links array is required.' },
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

    const linktree = await Linktree.findOne({
      slug: params.slug,
      userId: session.user.id,
    });

    if (!linktree) {
      return NextResponse.json(
        { error: 'Linktree not found' },
        { status: 404 }
      );
    }

    // Update each link's order
    links.forEach((updatedLink) => {
      const link = linktree.links.id(updatedLink._id);
      if (link) {
        link.order = updatedLink.order;
      }
    });

    await linktree.save();

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error reordering links:', error);
    
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