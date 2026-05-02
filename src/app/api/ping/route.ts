import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';

export const dynamic = 'force-dynamic';

async function _GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      message: 'pong',
      time: new Date().toISOString()
    }
  });
}

export const GET = withApiLogging(_GET, '/api/ping');
