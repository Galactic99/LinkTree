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

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string, linkId: string } }
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

    const { slug, linkId } = params;
    const body = await request.json();

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
      slug,
      userId: session.user.id,
    });

    if (!linktree) {
      return NextResponse.json(
        { error: 'Linktree not found' },
        { status: 404 }
      );
    }

    // Find the link by ID
    const link = linktree.links.id(linkId);
    if (!link) {
      return NextResponse.json(
        { error: 'Link not found' },
        { status: 404 }
      );
    }

    // Update link properties
    Object.keys(body).forEach(key => {
      if (key !== '_id' && key !== 'id') {
        link[key] = body[key];
      }
    });

    await linktree.save();

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error updating link:', error);
    
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

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string, linkId: string } }
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

    const { slug, linkId } = params;

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
      slug,
      userId: session.user.id,
    });

    if (!linktree) {
      return NextResponse.json(
        { error: 'Linktree not found' },
        { status: 404 }
      );
    }

    // Remove the link
    linktree.links.id(linkId).deleteOne();
    await linktree.save();

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error deleting link:', error);
    
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