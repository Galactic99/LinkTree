import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import ABTest from '@/app/models/ABTest';

export async function POST(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    const { variantId, type } = await request.json();

    if (!variantId || !['impression', 'click'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    await connectDB();
    const test = await ABTest.findOne({
      _id: params.testId,
      status: 'active',
    });

    if (!test) {
      return NextResponse.json(
        { error: 'A/B test not found or not active' },
        { status: 404 }
      );
    }

    const variant = test.variants.id(variantId);
    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Update the appropriate metric
    if (type === 'impression') {
      variant.impressions += 1;
    } else {
      variant.clicks += 1;
    }

    await test.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking metrics:', error);
    return NextResponse.json(
      { error: 'Failed to track metrics' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { testId: string } }
) {
  try {
    await connectDB();
    const test = await ABTest.findById(params.testId);

    if (!test) {
      return NextResponse.json(
        { error: 'A/B test not found' },
        { status: 404 }
      );
    }

    // Calculate metrics for each variant
    const metrics = test.variants.map(variant => ({
      variantId: variant._id,
      title: variant.title,
      impressions: variant.impressions,
      clicks: variant.clicks,
      ctr: variant.impressions > 0 
        ? (variant.clicks / variant.impressions) * 100 
        : 0,
    }));

    // Calculate winner based on CTR
    let winner = null;
    if (test.status === 'completed' && metrics.length > 0) {
      winner = metrics.reduce((prev, current) => 
        (current.ctr > prev.ctr) ? current : prev
      );
    }

    return NextResponse.json({
      metrics,
      winner,
      startDate: test.startDate,
      endDate: test.endDate,
      status: test.status,
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
} 