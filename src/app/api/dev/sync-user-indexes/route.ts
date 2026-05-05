import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, message: 'dev only' }, { status: 403 });
  }

  await dbConnect();

  // 변경 전 인덱스 목록
  const before = await User.collection.indexes();

  // 1) null/빈 문자열로 저장된 kakaoId/googleId를 unset (sparse가 진짜 sparse가 되도록)
  const cleanupKakao = await User.collection.updateMany(
    { $or: [{ kakaoId: null }, { kakaoId: '' }] },
    { $unset: { kakaoId: '' } }
  );
  const cleanupGoogle = await User.collection.updateMany(
    { $or: [{ googleId: null }, { googleId: '' }] },
    { $unset: { googleId: '' } }
  );

  // 2) 기존 unique 인덱스 모두 제거 후 partial filter로 재생성
  for (const index of before) {
    if (index.name === 'kakaoId_1' || index.name === 'googleId_1') {
      try {
        await User.collection.dropIndex(index.name);
      } catch {
        /* ignore */
      }
    }
  }

  // 3) partialFilterExpression: 문자열일 때만 unique
  await User.collection.createIndex(
    { kakaoId: 1 },
    { unique: true, partialFilterExpression: { kakaoId: { $type: 'string' } } }
  );
  await User.collection.createIndex(
    { googleId: 1 },
    { unique: true, partialFilterExpression: { googleId: { $type: 'string' } } }
  );

  const after = await User.collection.indexes();

  return NextResponse.json({
    success: true,
    data: {
      cleanedKakaoIdNulls: cleanupKakao.modifiedCount,
      cleanedGoogleIdNulls: cleanupGoogle.modifiedCount,
      before: before.map((i) => ({ name: i.name, key: i.key, sparse: i.sparse, unique: i.unique })),
      after: after.map((i) => ({
        name: i.name,
        key: i.key,
        unique: i.unique,
        partial: i.partialFilterExpression
      }))
    }
  });
}
