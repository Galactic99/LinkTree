import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import User from '@/app/models/User';

export async function DELETE(
  request: Request,
  { params }: { params: { domain: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      );
    }

    const domainIndex = user.customDomains?.findIndex(
      d => d.domain === decodeURIComponent(params.domain)
    );

    if (domainIndex === -1 || domainIndex === undefined) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    user.customDomains.splice(domainIndex, 1);
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Domain delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete domain' },
      { status: 500 }
    );
  }
} 