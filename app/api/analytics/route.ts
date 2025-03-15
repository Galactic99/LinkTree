import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Analytics from '@/app/models/Analytics';

export async function POST(request: Request) {
  try {
    const { linktreeId, linkId, referrer } = await request.json();
    const headers = new Headers(request.headers);
    
    await connectDB();

    // Create analytics entry
    const analytics = await Analytics.create({
      linktreeId,
      linkId,
      ip: headers.get('x-forwarded-for') || 'unknown',
      userAgent: headers.get('user-agent'),
      referrer,
      // Note: In a production environment, you'd want to use a geolocation service
      // to populate country and city based on IP
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const linktreeId = searchParams.get('linktreeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    await connectDB();

    const query: any = { linktreeId };
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .limit(1000); // Reasonable limit for initial implementation

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 