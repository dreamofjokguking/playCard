export const ALLOWED_SPORT_TYPES = ['jokgu', 'soccer', 'baseball', 'etc'] as const;
export type SportType = (typeof ALLOWED_SPORT_TYPES)[number];

export type MetricInput = {
  key: string;
  label: string;
  isActive?: boolean;
  order?: number;
};

export function isSportType(value: string): value is SportType {
  return (ALLOWED_SPORT_TYPES as readonly string[]).includes(value);
}

export function normalizeMetricInput(metrics: MetricInput[]) {
  const normalized = metrics.map((metric, index) => ({
    key: metric.key.trim(),
    label: metric.label.trim(),
    isActive: metric.isActive ?? true,
    order: typeof metric.order === 'number' ? metric.order : index + 1
  }));

  for (const metric of normalized) {
    if (!metric.key || !metric.label) {
      return { ok: false as const, message: 'positionMetrics의 key/label은 비어 있을 수 없습니다.' };
    }
  }

  const keySet = new Set<string>();
  for (const metric of normalized) {
    if (keySet.has(metric.key)) {
      return { ok: false as const, message: `중복된 metric key가 있습니다: ${metric.key}` };
    }
    keySet.add(metric.key);
  }

  return { ok: true as const, data: normalized };
}
