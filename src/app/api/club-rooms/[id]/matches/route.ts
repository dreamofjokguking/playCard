import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import Match from '@/lib/models/Match';

export const dynamic = 'force-dynamic';

async function _GET(_request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();
  const clubRoomId = context.params.id;
  if (!clubRoomId) {
    return NextResponse.json({ success: false, message: 'clubRoomId가 필요합니다.' }, { status: 400 });
  }

  const matches = await Match.find({ clubRoomId, status: 'completed' })
    .select({ _id: 1, date: 1, time: 1, venue: 1 })
    .sort({ date: -1 })
    .lean();

  return NextResponse.json({
    success: true,
    data: matches.map((match) => ({
      _id: String(match._id),
      date: match.date,
      time: match.time,
      venue: match.venue ?? ''
    }))
  });
}

export const GET = withApiLogging(_GET, '/api/club-rooms/[id]/matches');
