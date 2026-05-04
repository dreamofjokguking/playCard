import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { SESSION_COOKIE_NAME } from '@/lib/authSession';
import ClubRoom from '@/lib/models/ClubRoom';
import User from '@/lib/models/User';
import Match from '@/lib/models/Match';
import Evaluation from '@/lib/models/Evaluation';
import AiSettings, { DEFAULT_AI_MODEL, DEFAULT_AI_TITLE_PROMPT } from '@/lib/models/AiSettings';

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
    await Evaluation.deleteMany({ clubRoomId: oldClubRoomId });
    await Match.deleteMany({ clubRoomId: oldClubRoomId });
    await User.deleteMany({ clubRoomId: oldClubRoomId });
    await ClubRoom.deleteOne({ _id: existingClubRoom._id });
  }

  // AI 설정도 기본값으로 재적용 (등급 정의 포함된 최신 프롬프트로)
  await AiSettings.findOneAndUpdate(
    { scope: 'global' },
    { $set: { titlePrompt: DEFAULT_AI_TITLE_PROMPT, modelName: DEFAULT_AI_MODEL, updatedBy: 'seed' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

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

  // User 생성 — 첫 1명은 service_admin (서비스 최상위 + 클럽 owner), 두 번째는 admin, 나머지 member
  const userDocs = await Promise.all(
    PLAYERS.map((player, index) => {
      const role = index === 0 ? 'service_admin' : index === 1 ? 'admin' : 'member';
      return User.create({
        clubRoomId,
        kakaoId: player.kakaoId,
        nickname: player.displayName,
        displayName: player.displayName,
        role,
        status: 'active',
        currentTitle: index === 0 ? '오늘의 에이스' : index === 1 ? '벽돌 같은 수비' : ''
      });
    })
  );
  const userIdMap = new Map(userDocs.map((doc) => [doc.kakaoId, String(doc._id)]));

  // 등급 시뮬레이션 헬퍼 (점수 기반)
  function pickRarity(overall: number, isMvp: boolean): 'common' | 'rare' | 'epic' | 'legendary' {
    if (overall >= 8.6 && isMvp) return 'legendary';
    if (overall >= 8.0) return 'epic';
    if (overall >= 7.0) return 'rare';
    return 'common';
  }

  // 풀: 메트릭 best 기반 sample title (실제로는 Gemini가 생성)
  const TITLE_POOL_BY_BEST: Record<string, string[]> = {
    attack: ['블록 분쇄자', '네트의 폭격기', '한 방 결정자', '공격 머신'],
    defense: ['벽돌 같은 수비', '디그의 수문장', '지지않는 라인', '코트의 방패'],
    toss: ['손끝의 마법사', '템포 메이커', '코트의 지휘자', '정밀한 손'],
    serve: ['에이스 발사기', '서브의 칼날', '코트 위 저격수', '한 방 서브']
  };

  function bestMetricKey(metricStats: Array<{ metricKey: string; avg: number }>): string {
    return metricStats.reduce((a, b) => (a.avg >= b.avg ? a : b)).metricKey;
  }

  // Match 5경기 생성 (가장 오래된 것부터 → 가장 최근)
  const today = new Date();
  const matchIds: string[] = [];
  let lastMatchTitleByUser = new Map<string, { title: string; rarity: 'common' | 'rare' | 'epic' | 'legendary'; matchId: string; createdAt: Date }>();

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
        absences: [],
        mvpCount: 0,
        comments: [] as string[],
        title: '',
        rarity: 'common' as 'common' | 'rare' | 'epic' | 'legendary'
      };
    });

    // MVP는 해당 경기에서 overall 가장 높은 사람
    const mvpStat = playerStats.reduce((a, b) => (a.overall > b.overall ? a : b));
    mvpStat.mvpCount = 1;

    // 시뮬레이션 칭호 + 등급 부여
    for (const stat of playerStats) {
      const isMvp = stat.userId === mvpStat.userId;
      const rarity = pickRarity(stat.overall, isMvp);
      const bestKey = bestMetricKey(stat.metricStats);
      const pool = TITLE_POOL_BY_BEST[bestKey] ?? ['평범한 활약자'];
      const title = pool[(matchIndex + Math.floor(stat.overall * 10)) % pool.length];
      stat.title = title;
      stat.rarity = rarity;
      lastMatchTitleByUser.set(stat.userId, { title, rarity, matchId: '', createdAt: matchDate });
    }

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

    // matchId 갱신 (lastMatchTitleByUser)
    const createdId = String(created._id);
    for (const stat of playerStats) {
      const entry = lastMatchTitleByUser.get(stat.userId);
      if (entry) entry.matchId = createdId;
    }
  }

  // User.currentTitle / currentRarity / titleHistory 동기화 (가장 최근 매치의 칭호)
  await Promise.all(
    Array.from(lastMatchTitleByUser.entries()).map(async ([userId, entry]) =>
      User.findByIdAndUpdate(userId, {
        currentTitle: entry.title,
        currentRarity: entry.rarity,
        $push: {
          titleHistory: {
            title: entry.title,
            rarity: entry.rarity,
            matchId: entry.matchId,
            createdAt: entry.createdAt
          }
        }
      })
    )
  );

  // 추가 매치 1개 — 진행 중(evaluating). 김공격(seed-pc2-u1) 외 7명은 평가 제출 끝.
  // 김공격이 마지막으로 평가 제출하면 즉시 마감 → 칭호 생성 흐름 검증 가능.
  const adminUserId = userIdMap.get('seed-pc2-u1')!;
  const todayMatchDate = new Date(today);
  const evaluatingParticipants = PLAYERS.map((player) => userIdMap.get(player.kakaoId)!);
  const evaluatingTeamAssignments = evaluatingParticipants.map((userId, index) => ({
    userId,
    team: (index % 2 === 0 ? 'red' : 'blue') as 'red' | 'blue'
  }));

  const evaluatingMatch = await Match.create({
    clubRoomId,
    date: todayMatchDate,
    time: '20:00',
    venue: '시민체육관 B코트',
    participants: evaluatingParticipants,
    teamAssignments: evaluatingTeamAssignments,
    status: 'evaluating',
    positionSubmissions: evaluatingParticipants.map((userId) => ({
      userId,
      selectedMetrics: METRICS,
      submittedAt: todayMatchDate
    })),
    // 김공격(첫 사용자) 제외 7명은 이미 평가 제출 완료
    evaluationsSubmitted: evaluatingParticipants.slice(1),
    mvpVotes: evaluatingParticipants.slice(1).map((userId) => ({
      voterId: userId,
      selectedUserId: adminUserId
    })),
    createdBy: adminUserId
  });

  // 7명분 Evaluation 도큐먼트 생성 (각자가 본인 외 7명에 대한 평가)
  const evaluatingMatchId = String(evaluatingMatch._id);
  const SAMPLE_COMMENTS_BY_TARGET: Record<string, string[]> = {
    'seed-pc2-u1': ['공격이 매서웠음', '결정적 한 방', '리더십 좋았어요'],
    'seed-pc2-u2': ['수비가 벽이었음', '디그 좋음', '안정감 있었어요'],
    'seed-pc2-u3': ['올라운더 활약', '클러치 상황 좋음', '센스 좋음'],
    'seed-pc2-u4': ['서브 위협적', '한 박자 빨랐음', '날카로웠어요'],
    'seed-pc2-u5': ['신예답지 않은 패기', '실수 적음', '발전 가능성'],
    'seed-pc2-u6': ['토스 정확도 굿', '템포 조절 좋음', '리시브도 안정적'],
    'seed-pc2-u7': ['공수 균형', '꾸준한 활약', '큰 경기 강함'],
    'seed-pc2-u8': ['루키지만 잘함', '폼 좋음', '향후 기대됨']
  };

  for (const evaluator of PLAYERS.slice(1)) {
    const evaluatorId = userIdMap.get(evaluator.kakaoId)!;
    const ratings = PLAYERS.filter((p) => p.kakaoId !== evaluator.kakaoId).map((target) => {
      const targetUserId = userIdMap.get(target.kakaoId)!;
      const comments = SAMPLE_COMMENTS_BY_TARGET[target.kakaoId] ?? [];
      return {
        targetUserId,
        metricScores: METRICS.map((metricKey) => ({
          metricKey,
          score: clamp10((target.base as Record<string, number>)[metricKey] + (Math.random() * 0.6 - 0.3))
        })),
        absences: [],
        comment: comments[Math.floor(Math.random() * Math.max(comments.length, 1))] ?? ''
      };
    });
    await Evaluation.create({
      clubRoomId,
      matchId: evaluatingMatchId,
      evaluatorId,
      ratings,
      mvpPick: adminUserId,
      submittedAt: todayMatchDate
    });
  }

  matchIds.push(evaluatingMatchId);

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
