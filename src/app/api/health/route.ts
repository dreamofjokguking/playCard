import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';

export const dynamic = 'force-dynamic';

async function _GET(_request: NextRequest) {
  try {
    await dbConnect();

    return NextResponse.json({
      success: true,
      data: {
        status: 'ok',
        db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown DB error';
    return NextResponse.json(
      {
        success: false,
        message: 'DB connection failed',
        data: {
          status: 'degraded',
          db: 'disconnected',
          error: message
        }
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(_GET, '/api/health');
