import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { SESSION_COOKIE_NAME } from '@/lib/authSession';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';
import Match from '@/lib/models/Match';

export const dynamic = 'force-dynamic';

const SEED_TAG = '[SEED-PC2]';

type PlayerSeed = {
  kakaoId: string;
  displayName: string;
  base: { attack: number; defense: number; toss: number; serve: number };
};

const PLAYERS: PlayerSeed[] = [
  { kakaoId: 'seed-pc2-u1', displayName: '김공격', base: { attack: 9.0, defense: 6.2, toss: 7.0, serve: 6.5 } },
  { kakaoId: 'seed-pc2-u2', displayName: '박수비', base: { attack: 6.4, defense: 8.6, toss: 6.8, serve: 6.0 } },
  { kakaoId: 'seed-pc2-u3', displayName: '이올라운더', base: { attack: 7.6, defense: 7.4, toss: 7.8, serve: 7.5 } },
  { kakaoId: 'seed-pc2-u4', displayName: '최서브', base: { attack: 6.2, defense: 6.0, toss: 5.5, serve: 9.1 } },
  { kakaoId: 'seed-pc2-u5', displayName: '정신예', base: { attack: 7.0, defense: 5.5, toss: 6.0, serve: 5.8 } },
  { kakaoId: 'seed-pc2-u6', displayName: '한토스', base: { attack: 5.4, defense: 6.8, toss: 8.8, serve: 6.4 } },
  { kakaoId: 'seed-pc2-u7', displayName: '오공수', base: { attack: 7.2, defense: 7.8, toss: 6.4, serve: 7.0 } },
  { kakaoId: 'seed-pc2-u8', displayName: '강루키', base: { attack: 5.6, defense: 5.4, toss: 5.2, serve: 5.0 } }
];

const METRICS = ['attack', 'defense', 'toss', 'serve'];

// 매 경기마다 각 사용자에게 줄 점수 오프셋 (직전 대비 변동을 유발). 5경기 분량.
const MATCH_OFFSETS: Array<Record<string, number>> = [
  { 'seed-pc2-u1': 0.0, 'seed-pc2-u2': -0.4, 'seed-pc2-u3': -0.6, 'seed-pc2-u4': 0.5, 'seed-pc2-u5': -0.2, 'seed-pc2-u6': -0.5, 'seed-pc2-u7': -0.3, 'seed-pc2-u8': -0.4 },
  { 'seed-pc2-u1': -0.3, 'seed-pc2-u2': 0.4, 'seed-pc2-u3': 0.2, 'seed-pc2-u4': -0.4, 'seed-pc2-u5': 0.5, 'seed-pc2-u6': 0.4, 'seed-pc2-u7': 0.3, 'seed-pc2-u8': 0.0 },
  { 'seed-pc2-u1': 0.4, 'seed-pc2-u2': -0.2, 'seed-pc2-u3': 0.6, 'seed-pc2-u4': 0.2, 'seed-pc2-u5': -0.4, 'seed-pc2-u6': -0.2, 'seed-pc2-u7': 0.5, 'seed-pc2-u8': 0.3 },
  { 'seed-pc2-u1': -0.5, 'seed-pc2-u2': 0.6, 'seed-pc2-u3': -0.2, 'seed-pc2-u4': 0.6, 'seed-pc2-u5': 0.2, 'seed-pc2-u6': 0.6, 'seed-pc2-u7': -0.4, 'seed-pc2-u8': 0.5 },
  { 'seed-pc2-u1': 0.6, 'seed-pc2-u2': -0.5, 'seed-pc2-u3': 0.4, 'seed-pc2-u4': -0.6, 'seed-pc2-u5': -0.3, 'seed-pc2-u6': 0.3, 'seed-pc2-u7': 0.6, 'seed-pc2-u8': -0.2 }
];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp10(value: number): number {
  if (value < 0) return 0;
  if (value > 10) return 10;
  return round1(value);
}

async function _POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: '운영 환경에서는 실행할 수 없습니다.' }, { status: 403 });
  }

  await dbConnect();

  // 기존 시드 데이터 정리
  const existingClubRoom = await ClubRoom.findOne({ name: SEED_TAG }).lean();
  if (existingClubRoom) {
    const oldClubRoomId = String(existingClubRoom._id);
    await Match.deleteMany({ clubRoomId: oldClubRoomId });
    await User.deleteMany({ clubRoomId: oldClubRoomId });
    await ClubRoom.deleteOne({ _id: existingClubRoom._id });
  }

  // ClubRoom 생성
  const clubRoom = await ClubRoom.create({
    name: SEED_TAG,
    sportType: 'jokgu',
    ownerId: 'seed-pc2-u1',
    managers: ['seed-pc2-u1'],
    positionMetrics: METRICS.map((key, index) => ({
      key,
      label: { attack: '공격', defense: '수비', toss: '토스', serve: '서브' }[key] ?? key,
      isActive: true,
      order: index
    }))
  });
  const clubRoomId = String(clubRoom._id);

  // User 생성 — 첫 1명은 admin, 나머지 member
  const userDocs = await Promise.all(
    PLAYERS.map((player, index) =>
      User.create({
        clubRoomId,
        kakaoId: player.kakaoId,
        nickname: player.displayName,
        displayName: player.displayName,
        role: index === 0 ? 'admin' : 'member',
        status: 'active',
        currentTitle: index === 0 ? '오늘의 에이스' : index === 1 ? '벽돌 같은 수비' : ''
      })
    )
  );
  const userIdMap = new Map(userDocs.map((doc) => [doc.kakaoId, String(doc._id)]));

  // Match 5경기 생성 (가장 오래된 것부터 → 가장 최근)
  const today = new Date();
  const matchIds: string[] = [];
  for (let matchIndex = 0; matchIndex < MATCH_OFFSETS.length; matchIndex += 1) {
    const offset = MATCH_OFFSETS[matchIndex];
    const matchDate = new Date(today);
    matchDate.setDate(today.getDate() - (MATCH_OFFSETS.length - 1 - matchIndex) * 3);

    const playerStats = PLAYERS.map((player) => {
      const userId = userIdMap.get(player.kakaoId)!;
      const playerOffset = offset[player.kakaoId] ?? 0;
      const metricStats = METRICS.map((metricKey) => ({
        metricKey,
        avg: clamp10((player.base as Record<string, number>)[metricKey] + playerOffset),
        count: 7 // 8명 중 본인 제외
      }));
      const overall = round1(metricStats.reduce((sum, m) => sum + m.avg, 0) / metricStats.length);
      return {
        userId,
        metricStats,
        overall,
        absences: [], // 8명 모두 4메트릭 모두 출전 가정
        mvpCount: 0,
        comments: []
      };
    });

    // MVP는 해당 경기에서 overall 가장 높은 사람
    const mvpStat = playerStats.reduce((a, b) => (a.overall > b.overall ? a : b));
    mvpStat.mvpCount = 1;

    const participants = PLAYERS.map((player) => userIdMap.get(player.kakaoId)!);
    const teamAssignments = participants.map((userId, index) => ({
      userId,
      team: (index % 2 === 0 ? 'red' : 'blue') as 'red' | 'blue'
    }));

    const created = await Match.create({
      clubRoomId,
      date: matchDate,
      time: '19:00',
      venue: '시민체육관 A코트',
      participants,
      teamAssignments,
      status: 'completed',
      positionSubmissions: participants.map((userId) => ({
        userId,
        selectedMetrics: METRICS,
        submittedAt: matchDate
      })),
      evaluationsSubmitted: participants,
      mvpVotes: participants.map((userId) => ({ voterId: userId, selectedUserId: mvpStat.userId })),
      results: { playerStats },
      createdBy: userIdMap.get('seed-pc2-u1')!
    });
    matchIds.push(String(created._id));
  }

  const adminUserId = userIdMap.get('seed-pc2-u1')!;

  const summary = {
    clubRoomId,
    matchIds,
    users: userDocs.map((doc) => ({
      userId: String(doc._id),
      displayName: doc.displayName,
      kakaoId: doc.kakaoId,
      role: doc.role
    })),
    autoLoggedInAs: { userId: adminUserId, displayName: '김공격' }
  };

  // 응답에 자동 로그인 쿠키도 같이 세팅 (편의)
  const response = NextResponse.json({ success: true, data: summary });
  response.cookies.set(SESSION_COOKIE_NAME, adminUserId, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/'
  });
  return response;
}

export const POST = withApiLogging(_POST, '/api/dev/seed');
