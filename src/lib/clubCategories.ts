export const CLUB_CATEGORIES = [
  '축구',
  '풋살',
  '야구',
  '배구',
  '농구',
  '족구',
  '테니스',
  '배드민턴',
  '탁구',
  '골프',
  '볼링',
  '당구',
  '등산',
  '자전거',
  '러닝',
  '수영',
  '클라이밍',
  '댄스',
  '기타'
] as const;

export type ClubCategory = (typeof CLUB_CATEGORIES)[number];

export function isClubCategory(value: string): value is ClubCategory {
  return (CLUB_CATEGORIES as readonly string[]).includes(value);
}
