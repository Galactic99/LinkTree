import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import connectDB from '@/app/lib/mongodb';
import User from '@/app/models/User';
import dns from 'dns/promises';

export async function POST(
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

    const domain = decodeURIComponent(params.domain);
    const domainData = user.customDomains?.find(d => d.domain === domain);

    if (!domainData) {
      return NextResponse.json(
        { error: 'Domain not found' },
        { status: 404 }
      );
    }

    try {
      // In a real application, you would:
      // 1. Check DNS records (CNAME or A record)
      // 2. Verify SSL certificate
      // 3. Test domain resolution
      // 4. Set up domain in your hosting provider

      // For demo purposes, we'll just check if the domain resolves
      await dns.resolve(domain);

      // Update domain verification status
      domainData.verified = true;
      await user.save();

      return NextResponse.json(domainData);
    } catch (dnsError) {
      return NextResponse.json(
        { error: 'Domain verification failed. Please check your DNS settings.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Domain verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify domain' },
      { status: 500 }
    );
  }
} 