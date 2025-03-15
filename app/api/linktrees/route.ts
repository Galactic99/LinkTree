import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Linktree from '@/app/models/Linktree';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    await connectDB();

    const linktrees = await Linktree.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .select('title slug theme isDefault createdAt');

    return NextResponse.json(linktrees);
  } catch (error) {
    console.error('Error fetching linktrees:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, slug, theme, isDefault } = body;

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

    await connectDB();

    // Check if slug is already taken
    const existingLinktree = await Linktree.findOne({ slug });
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
      links: [],
    });

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error creating linktree:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 