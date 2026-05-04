import { NextRequest, NextResponse } from 'next/server';
import { withApiLogging } from '@/lib/apiLogger';
import { dbConnect } from '@/lib/db';
import { requireServiceAdmin } from '@/lib/accessControl';
import AiSettings, { DEFAULT_AI_MODEL, DEFAULT_AI_TITLE_PROMPT } from '@/lib/models/AiSettings';

export const dynamic = 'force-dynamic';

const ALLOWED_PLACEHOLDERS = ['{displayName}', '{comments}', '{metricStats}'];

type SettingsBody = {
  titlePrompt?: string;
  modelName?: string;
};

async function ensureSettings() {
  return AiSettings.findOneAndUpdate(
    { scope: 'global' },
    { $setOnInsert: { titlePrompt: DEFAULT_AI_TITLE_PROMPT, modelName: DEFAULT_AI_MODEL } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
}

async function _GET(request: NextRequest) {
  await dbConnect();
  const auth = await requireServiceAdmin(request);
  if (!auth.ok) return auth.response;

  const settings = await ensureSettings();
  return NextResponse.json({
    success: true,
    data: {
      titlePrompt: settings?.titlePrompt ?? DEFAULT_AI_TITLE_PROMPT,
      modelName: settings?.modelName ?? DEFAULT_AI_MODEL,
      defaults: {
        titlePrompt: DEFAULT_AI_TITLE_PROMPT,
        modelName: DEFAULT_AI_MODEL,
        placeholders: ALLOWED_PLACEHOLDERS
      },
      updatedAt: (settings as { updatedAt?: Date } | null)?.updatedAt ?? null,
      updatedBy: settings?.updatedBy ?? ''
    }
  });
}

async function _PATCH(request: NextRequest) {
  await dbConnect();
  const auth = await requireServiceAdmin(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as SettingsBody;
  const titlePrompt = body.titlePrompt?.trim();
  const modelName = body.modelName?.trim();

  if (titlePrompt !== undefined && titlePrompt.length === 0) {
    return NextResponse.json({ success: false, message: '프롬프트는 비워둘 수 없습니다.' }, { status: 400 });
  }
  if (modelName !== undefined && modelName.length === 0) {
    return NextResponse.json({ success: false, message: '모델 이름은 비워둘 수 없습니다.' }, { status: 400 });
  }
  if (titlePrompt && !titlePrompt.includes('{displayName}')) {
    return NextResponse.json(
      { success: false, message: '프롬프트에 최소한 {displayName} placeholder는 포함되어야 합니다.' },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = { updatedBy: auth.access.actorId };
  if (titlePrompt) update.titlePrompt = titlePrompt;
  if (modelName) update.modelName = modelName;

  const updated = await AiSettings.findOneAndUpdate(
    { scope: 'global' },
    { $set: update, $setOnInsert: { titlePrompt: DEFAULT_AI_TITLE_PROMPT, modelName: DEFAULT_AI_MODEL } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({
    success: true,
    data: {
      titlePrompt: updated?.titlePrompt ?? DEFAULT_AI_TITLE_PROMPT,
      modelName: updated?.modelName ?? DEFAULT_AI_MODEL,
      updatedAt: (updated as { updatedAt?: Date } | null)?.updatedAt ?? null,
      updatedBy: updated?.updatedBy ?? ''
    }
  });
}

export const GET = withApiLogging(_GET, '/api/admin/ai/settings');
export const PATCH = withApiLogging(_PATCH, '/api/admin/ai/settings');
