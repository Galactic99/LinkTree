import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import ABTest from '@/app/models/ABTest';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const tests = await ABTest.find({ userId: session.user.id })
      .sort({ startDate: -1 });

    return NextResponse.json(tests);
  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch A/B tests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, variants, linktreeId, linkId } = data;

    if (!name || !variants || variants.length < 2 || !linktreeId || !linkId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();
    const test = await ABTest.create({
      userId: session.user.id,
      name,
      variants: variants.map((v: any) => ({
        ...v,
        impressions: 0,
        clicks: 0,
      })),
      linktreeId,
      linkId,
      status: 'active',
      startDate: new Date(),
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error('Error creating A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to create A/B test' },
      { status: 500 }
    );
  }
} 