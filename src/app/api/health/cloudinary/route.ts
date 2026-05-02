import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { configureCloudinary } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

async function _GET(_request: NextRequest) {
  try {
    const cloudinary = configureCloudinary();
    const result = await cloudinary.api.ping();

    return NextResponse.json({
      success: true,
      data: {
        status: 'ok',
        cloudinary: result.status ?? 'ok'
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Cloudinary error';
    return NextResponse.json(
      {
        success: false,
        message: 'Cloudinary connection failed',
        data: {
          status: 'degraded',
          error: message
        }
      },
      { status: 500 }
    );
  }
}

export const GET = withApiLogging(_GET, '/api/health/cloudinary');
