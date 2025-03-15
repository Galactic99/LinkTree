import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Linktree from '@/app/models/Linktree';

export async function POST(
  request: Request,
  { params }: { params: { linktreeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, url, enabled, order } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: 'Title and URL are required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const linktree = await Linktree.findOne({
      _id: params.linktreeId,
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
      enabled,
      order,
    });

    await linktree.save();

    return NextResponse.json(linktree);
  } catch (error) {
    console.error('Error adding link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 