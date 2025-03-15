import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ABTest from '@/app/models/ABTest';

export async function GET(
  request: Request,
  { params }: { params: { linkId: string } }
) {
  try {
    if (!params.linkId) {
      return NextResponse.json(
        { error: 'Link ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Find the test by linkId (not _id)
    const test = await ABTest.findOne({
      linkId: params.linkId,
      status: 'active',
    }).select('_id status variants');

    if (!test) {
      return NextResponse.json(
        { error: 'No active A/B test found for this link' },
        { status: 404 }
      );
    }

    // Return a safe version of the test data
    return NextResponse.json({
      _id: test._id.toString(),
      status: test.status,
      variants: test.variants.map(v => ({
        _id: v._id.toString(),
        title: v.title,
        url: v.url
      }))
    });
  } catch (error) {
    console.error('Error fetching A/B test:', error);
    return NextResponse.json(
      { error: 'Failed to fetch A/B test' },
      { status: 500 }
    );
  }
} 