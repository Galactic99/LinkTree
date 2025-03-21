import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import Analytics from '@/app/models/Analytics';
import Linktree from '@/app/models/Linktree';

export async function POST(request: Request) {
  try {
    console.log('Analytics POST request received');
    const { linktreeId, linkId, referrer } = await request.json();
    console.log('Request data:', { linktreeId, linkId, referrer });
    
    const headers = new Headers(request.headers);
    const ip = headers.get('x-forwarded-for') || 'unknown';
    const userAgent = headers.get('user-agent') || 'unknown';
    
    console.log('Connecting to database...');
    await connectDB();
    console.log('Connected to database');

    // Find the linktree by slug
    let actualLinktreeId = linktreeId;
    
    // Check if linktreeId is a slug and not a MongoDB ID
    if (linktreeId && !linktreeId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('Looking up linktree by slug:', linktreeId);
      const linktree = await Linktree.findOne({ slug: linktreeId });
      if (linktree) {
        actualLinktreeId = linktree._id;
        console.log('Found linktree with ID:', actualLinktreeId);
      } else {
        console.log('Linktree not found with slug:', linktreeId);
        return NextResponse.json(
          { error: 'Linktree not found' },
          { status: 404 }
        );
      }
    }

    // Simple geolocation based on IP (in a real app, you'd use a proper geolocation service)
    let country = 'Unknown';
    let city = 'Unknown';
    
    console.log('Creating analytics entry...');
    // Create analytics entry
    const analytics = await Analytics.create({
      linktreeId: actualLinktreeId,
      linkId,
      ip,
      userAgent,
      referrer,
      country,
      city,
    });
    console.log('Analytics entry created:', analytics._id.toString());

    return NextResponse.json({ success: true, analyticsId: analytics._id.toString() });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to track analytics', message: error instanceof Error ? error.message : 'Unknown error' },
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
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    const limit = parseInt(searchParams.get('limit') || '1000');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    await connectDB();

    // Build query
    const query: any = {};
    
    // Verify the user owns this linktree
    if (linktreeId) {
      // First try to find by slug
      const linktree = await Linktree.findOne({ 
        slug: linktreeId,
        userId: session.user.id 
      });
      
      if (!linktree) {
        return NextResponse.json(
          { error: 'Linktree not found or not owned by user' },
          { status: 404 }
        );
      }
      
      // Use the actual _id for the query
      query.linktreeId = linktree._id;
    } else {
      // If no specific linktree is requested, get all linktrees owned by the user
      const userLinktrees = await Linktree.find({ userId: session.user.id }).select('_id');
      const linktreeIds = userLinktrees.map(lt => lt._id);
      query.linktreeId = { $in: linktreeIds };
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Get total count for pagination
    const total = await Analytics.countDocuments(query);
    
    // Get analytics data with pagination
    const analytics = await Analytics.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    return NextResponse.json(analytics, {
      headers: {
        'X-Total-Count': total.toString(),
        'X-Page': page.toString(),
        'X-Limit': limit.toString(),
        'X-Total-Pages': Math.ceil(total / limit).toString()
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
} 