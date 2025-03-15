import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  const startTime = Date.now();
  let connectionTime = 0;
  
  try {
    // Try to connect to MongoDB with a timeout
    await connectDB();
    connectionTime = Date.now() - startTime;
    
    // Check connection state
    const readyState = mongoose.connection.readyState;
    const readyStateMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };
    
    // Ping the database to verify connection is responsive
    const adminDb = mongoose.connection.db.admin();
    const pingResult = await adminDb.ping();
    
    return NextResponse.json({
      status: 'ok',
      database: {
        status: readyStateMap[readyState] || 'unknown',
        connectionTime: `${connectionTime}ms`,
        ping: pingResult.ok === 1 ? 'successful' : 'failed'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        connectionTime: `${connectionTime}ms`,
        status: 'failed'
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV || 'unknown'
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 