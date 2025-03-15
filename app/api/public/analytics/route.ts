import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import Analytics from '@/app/models/Analytics';
import Linktree from '@/app/models/Linktree';

export async function POST(request: Request) {
  try {
    console.log('Public analytics POST request received');
    const { linktreeId, linkId, referrer } = await request.json();
    console.log('Request data:', { linktreeId, linkId, referrer });
    
    if (!linktreeId || !linkId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
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