import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import ClubRoom from '@/lib/models/ClubRoom';
import { fetchChannelLatestVideos, isValidChannelId } from '@/lib/youtubeRss';

export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest, context: { params: { id: string } }) {
  await dbConnect();

  const { id } = context.params;
  const club = await ClubRoom.findById(id).select({ youtubeChannelId: 1 }).lean();
  if (!club) {
    return NextResponse.json({ success: false, message: '클럽을 찾을 수 없습니다.' }, { status: 404 });
  }

  const channelId = (club.youtubeChannelId ?? '').trim();
  if (!channelId) {
    return NextResponse.json({ success: true, data: { channelId: '', videos: [] } });
  }
  if (!isValidChannelId(channelId)) {
    return NextResponse.json({ success: false, message: '채널 ID 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  const limit = Number(request.nextUrl.searchParams.get('limit') ?? '5');
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 5;

  try {
    const videos = await fetchChannelLatestVideos(channelId, safeLimit);
    return NextResponse.json({ success: true, data: { channelId, videos } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'YouTube 피드 조회 실패'
      },
      { status: 502 }
    );
  }
}

export const GET = withApiLogging(_GET, '/api/club-rooms/[id]/youtube-latest');
