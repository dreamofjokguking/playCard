/**
 * Cloudinary URL에 transform segment를 삽입해 자동 포맷/품질/사이즈 최적화 적용.
 * - Cloudinary URL이 아닌 경우 원본을 그대로 반환 (placeholder, 외부 이미지 등 안전하게 통과)
 * - 이미 transform이 들어있는 URL은 새 transform으로 교체하지 않고 원본 반환 (혼란 방지)
 *
 * 예: https://res.cloudinary.com/demo/image/upload/v1/sample.jpg
 *   → https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_640/v1/sample.jpg
 */

const CLOUDINARY_HOST_PATTERN = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//;
const KNOWN_TRANSFORM_PREFIXES = /^(c_|w_|h_|q_|f_|g_|x_|y_|e_|l_|fl_|so_|du_|dpr_|ar_|r_|b_|o_)/;

export type TransformOptions = {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  format?: 'auto' | string;
  crop?: 'fill' | 'fit' | 'thumb' | 'limit';
};

function buildTransformSegment(options: TransformOptions): string {
  const parts: string[] = [];
  parts.push(`f_${options.format ?? 'auto'}`);
  parts.push(`q_${options.quality ?? 'auto'}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  if (options.width) parts.push(`w_${Math.round(options.width)}`);
  if (options.height) parts.push(`h_${Math.round(options.height)}`);
  return parts.join(',');
}

export function cloudinaryTransform(url: string, options: TransformOptions = {}): string {
  if (!url) return url;
  const match = url.match(CLOUDINARY_HOST_PATTERN);
  if (!match) return url;

  const prefix = match[0];
  const rest = url.slice(prefix.length);

  // 이미 transform segment가 있으면 그대로 통과 (segment의 첫 토큰이 알려진 transform 키로 시작하는지 확인)
  const firstSegment = rest.split('/')[0] ?? '';
  if (firstSegment && firstSegment.split(',').some((token) => KNOWN_TRANSFORM_PREFIXES.test(token))) {
    return url;
  }

  return `${prefix}${buildTransformSegment(options)}/${rest}`;
}
