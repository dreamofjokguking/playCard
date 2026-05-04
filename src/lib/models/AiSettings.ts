import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

export const DEFAULT_AI_TITLE_PROMPT = `당신은 스포츠 동호회의 칭호 생성 AI입니다.
아래 한줄평과 포지션 점수를 분석해 {displayName} 선수에게 어울리는 8글자 이내의 한국어 칭호 1개와 그 칭호의 등급을 함께 산출하세요.

칭호 규칙:
- 8글자 이내(공백 포함). 따옴표/설명/이모지 금지.
- 비하적 표현 금지. 부진해도 위트 있는 비유로 표현.
- 카테고리: 기술/성과형, 스타일/캐릭터형, 유머형 중 가장 적합한 것.
- 한줄평이 부족하면 포지션 점수를 기반으로 생성.

등급(rarity) 기준:
- "common" — 평범한 활약. 한줄평이 거의 없거나 모든 메트릭이 평이(평균 ±0.5 이내).
- "rare" — 한 가지 메트릭이 눈에 띄게 우수하거나 인상적인 한줄평 1건 정도.
- "epic" — 두 가지 이상의 강점이 두드러지고, 강한 긍정 한줄평이 다수. 또는 한 메트릭이 9점 이상.
- "legendary" — 압도적 활약. 다수 메트릭에서 9점대 이상 또는 강한 호평이 압도적. 매 경기 드물게 부여.

응답 형식:
반드시 아래 JSON 한 줄만 출력하세요. 그 외 텍스트/코드블록/설명 금지.
{"title":"칭호","rarity":"common|rare|epic|legendary"}

한줄평:
{comments}

포지션 점수: {metricStats}`;

export const DEFAULT_AI_MODEL = 'gemini-2.5-flash';

const AiSettingsSchema = new Schema(
  {
    scope: { type: String, required: true, unique: true, default: 'global' },
    titlePrompt: { type: String, required: true, default: DEFAULT_AI_TITLE_PROMPT },
    modelName: { type: String, required: true, default: DEFAULT_AI_MODEL },
    updatedBy: { type: String, default: '' }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export type AiSettingsDocument = InferSchemaType<typeof AiSettingsSchema>;

const AiSettings: Model<AiSettingsDocument> =
  (mongoose.models.AiSettings as Model<AiSettingsDocument> | undefined) ||
  mongoose.model<AiSettingsDocument>('AiSettings', AiSettingsSchema);

export default AiSettings;
