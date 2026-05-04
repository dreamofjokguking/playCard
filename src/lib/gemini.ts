import { GoogleGenerativeAI } from '@google/generative-ai';
import AiSettings, { DEFAULT_AI_MODEL, DEFAULT_AI_TITLE_PROMPT } from '@/lib/models/AiSettings';

export type TitleRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type TitleResult = {
  title: string;
  rarity: TitleRarity;
};

export type TitleGenerationInput = {
  displayName: string;
  comments?: string[];
  metricStats?: Array<{ metricKey: string; avg: number }>;
};

const RARITY_VALUES: TitleRarity[] = ['common', 'rare', 'epic', 'legendary'];

function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function isGeminiEnabled(): boolean {
  return getApiKey() !== null;
}

export function fillTitlePrompt(template: string, input: TitleGenerationInput): string {
  const comments = (input.comments ?? []).filter(Boolean);
  const metrics = (input.metricStats ?? []).map((row) => `${row.metricKey} ${row.avg.toFixed(1)}`).join(', ') || '데이터 없음';
  const commentsBlock = comments.length > 0 ? comments.map((line) => `- ${line}`).join('\n') : '한줄평 없음';
  return template
    .replaceAll('{displayName}', input.displayName)
    .replaceAll('{comments}', commentsBlock)
    .replaceAll('{metricStats}', metrics);
}

export function trimTitle(raw: string): string {
  return raw
    .replace(/[`"'""''「」『』\[\](){}]/g, '')
    .replace(/^칭호\s*:?/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 12);
}

function normalizeRarity(value: unknown): TitleRarity {
  if (typeof value !== 'string') return 'common';
  const v = value.trim().toLowerCase();
  return (RARITY_VALUES as string[]).includes(v) ? (v as TitleRarity) : 'common';
}

/**
 * Gemini 응답에서 { title, rarity } 추출.
 * 1차: ```json ... ``` 코드 블록 또는 JSON 객체 찾아 파싱
 * 2차: 칭호 텍스트만 있는 fallback (rarity는 'common')
 */
export function parseTitleResponse(raw: string): TitleResult | null {
  if (!raw) return null;
  const stripped = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // JSON 객체 추출 시도. JSON이 한 번이라도 잡히면 그 결과만 사용 (fallback로 가지 않음)
  const jsonMatch = stripped.match(/\{[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]) as { title?: unknown; rarity?: unknown };
      const title = typeof parsed.title === 'string' ? trimTitle(parsed.title) : '';
      if (title.length === 0) return null;
      return { title, rarity: normalizeRarity(parsed.rarity) };
    } catch {
      // 파싱 실패 시에만 fallback
    }
  }

  // fallback: 첫 줄을 칭호로 가정
  const firstLine = stripped.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0);
  if (!firstLine) return null;
  const title = trimTitle(firstLine);
  return title.length > 0 ? { title, rarity: 'common' } : null;
}

type LoadedSettings = { titlePrompt: string; modelName: string };

export async function loadAiSettings(): Promise<LoadedSettings> {
  try {
    const doc = await AiSettings.findOneAndUpdate(
      { scope: 'global' },
      { $setOnInsert: { titlePrompt: DEFAULT_AI_TITLE_PROMPT, modelName: DEFAULT_AI_MODEL } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    return {
      titlePrompt: doc?.titlePrompt || DEFAULT_AI_TITLE_PROMPT,
      modelName: doc?.modelName || DEFAULT_AI_MODEL
    };
  } catch {
    return { titlePrompt: DEFAULT_AI_TITLE_PROMPT, modelName: DEFAULT_AI_MODEL };
  }
}

export async function generateTitle(
  input: TitleGenerationInput,
  overrides?: Partial<LoadedSettings>
): Promise<TitleResult | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const settings = overrides && overrides.titlePrompt && overrides.modelName
    ? { titlePrompt: overrides.titlePrompt, modelName: overrides.modelName }
    : await loadAiSettings();
  const titlePrompt = overrides?.titlePrompt ?? settings.titlePrompt;
  const modelName = overrides?.modelName ?? settings.modelName;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: 0.95,
        maxOutputTokens: 256,
        ...({ thinkingConfig: { thinkingBudget: 0 } } as Record<string, unknown>)
      }
    });
    const result = await model.generateContent(fillTitlePrompt(titlePrompt, input));
    const text = result.response.text();
    const parsed = parseTitleResponse(text);
    if (!parsed) {
      console.warn('[gemini] empty/unparseable response. raw:', JSON.stringify(text));
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('[gemini] title generation failed:', error instanceof Error ? error.message : error);
    return null;
  }
}
