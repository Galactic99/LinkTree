import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Linktree from '@/app/models/Linktree';
import mongoose from 'mongoose';

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

export async function GET(
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
      userId: session.user.id,
    }).lean();
    
    const linktree = await withTimeout(queryPromise, 5000);

    if (!linktree) {
      return NextResponse.json(
        { error: 'Linktree not found' },
        { status: 404 }
      );
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

export async function PATCH(
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
    const { title, theme, isDefault, isPublic, footer } = body;

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

    // Update fields if provided
    if (title !== undefined) linktree.title = title;
    if (theme !== undefined) linktree.theme = theme;
    if (isPublic !== undefined) linktree.isPublic = isPublic;
    if (footer !== undefined) linktree.footer = footer;

    // If setting as default, unset any existing default
    if (isDefault) {
      await Linktree.updateMany(
        { userId: session.user.id, isDefault: true, _id: { $ne: linktree._id } },
        { isDefault: false }
      );
      linktree.isDefault = true;
    }

    await linktree.save();

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error updating linktree:', error);
    
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

    // Find the linktree first to verify ownership
    const linktree = await Linktree.findOne({
      slug: params.slug,
      userId: session.user.id,
    });

    if (!linktree) {
      return NextResponse.json(
        { error: 'Linktree not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

    // Delete the linktree
    await Linktree.findByIdAndDelete(linktree._id);

    // Also delete any associated analytics data
    // This would be a good place to add cleanup for other related data
    try {
      const Analytics = mongoose.models.Analytics;
      if (Analytics) {
        await Analytics.deleteMany({ linktreeId: linktree._id });
      }
    } catch (cleanupError) {
      console.error('Error cleaning up associated data:', cleanupError);
      // Continue with the response even if cleanup fails
    }

    return NextResponse.json({ success: true, message: 'Linktree deleted successfully' });
  } catch (error) {
    console.error('Error deleting linktree:', error);
    
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