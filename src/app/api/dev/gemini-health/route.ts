import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { generateTitle, isGeminiEnabled } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

async function _GET(_request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: '운영 환경에서는 실행할 수 없습니다.' }, { status: 403 });
  }

  if (!isGeminiEnabled()) {
    return NextResponse.json({
      success: false,
      message: 'GEMINI_API_KEY가 설정되지 않았습니다. .env.local에 추가 후 dev 서버를 재시작하세요.'
    });
  }

  const startedAt = Date.now();
  const result = await generateTitle({
    displayName: '김공격',
    comments: ['오늘 공격이 매서웠음', '상대 블록을 다 뚫고 들어감', '서브 미스 두 번 있었지만 공격으로 만회'],
    metricStats: [
      { metricKey: 'attack', avg: 9.2 },
      { metricKey: 'defense', avg: 6.4 },
      { metricKey: 'toss', avg: 7.0 },
      { metricKey: 'serve', avg: 5.8 }
    ]
  });
  const elapsedMs = Date.now() - startedAt;

  return NextResponse.json({
    success: result !== null,
    data: {
      title: result?.title ?? null,
      rarity: result?.rarity ?? null,
      elapsedMs,
      modelHint: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash'
    },
    message: result === null ? 'Gemini 응답을 받지 못했습니다. 키 또는 네트워크를 확인하세요.' : undefined
  });
}

export const GET = withApiLogging(_GET, '/api/dev/gemini-health');
