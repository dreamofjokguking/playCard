import { describe, expect, it } from 'vitest';
import { fillTitlePrompt, parseTitleResponse, trimTitle } from './gemini';
import { DEFAULT_AI_TITLE_PROMPT } from './models/AiSettings';

describe('gemini helpers', () => {
  describe('fillTitlePrompt', () => {
    it('substitutes displayName / comments / metricStats placeholders', () => {
      const prompt = fillTitlePrompt(DEFAULT_AI_TITLE_PROMPT, {
        displayName: '김공격',
        comments: ['오늘 공격 좋음', '서브 미스 하나'],
        metricStats: [
          { metricKey: 'attack', avg: 8.4 },
          { metricKey: 'defense', avg: 6.2 }
        ]
      });
      expect(prompt).toContain('김공격');
      expect(prompt).toContain('- 오늘 공격 좋음');
      expect(prompt).toContain('attack 8.4');
      expect(prompt).toContain('defense 6.2');
    });

    it('uses fallback strings when comments or metrics are empty', () => {
      const prompt = fillTitlePrompt(DEFAULT_AI_TITLE_PROMPT, { displayName: '김공격' });
      expect(prompt).toContain('한줄평 없음');
      expect(prompt).toContain('데이터 없음');
    });

    it('replaces all occurrences of a placeholder', () => {
      const template = '안녕 {displayName}, {displayName}님은 어떤 칭호가?';
      expect(fillTitlePrompt(template, { displayName: '김공격' })).toBe(
        '안녕 김공격, 김공격님은 어떤 칭호가?'
      );
    });

    it('contains rarity guidelines and JSON response shape', () => {
      const prompt = fillTitlePrompt(DEFAULT_AI_TITLE_PROMPT, { displayName: '김공격' });
      expect(prompt).toContain('rarity');
      expect(prompt).toContain('common');
      expect(prompt).toContain('legendary');
      expect(prompt).toContain('"title"');
    });
  });

  describe('trimTitle', () => {
    it('removes wrapping quotes and "칭호:" prefix', () => {
      expect(trimTitle('"네트 위의 암살자"')).toBe('네트 위의 암살자');
      expect(trimTitle('칭호: 블록 분쇄 공격자')).toBe('블록 분쇄 공격자');
      expect(trimTitle('「벽돌 같은 수비」')).toBe('벽돌 같은 수비');
    });

    it('caps to 12 characters', () => {
      expect(trimTitle('아주 길고 긴 환상의 칭호 만들기 무한도전')).toHaveLength(12);
    });
  });

  describe('parseTitleResponse', () => {
    it('parses raw JSON object', () => {
      const result = parseTitleResponse('{"title":"네트 위의 암살자","rarity":"epic"}');
      expect(result).toEqual({ title: '네트 위의 암살자', rarity: 'epic' });
    });

    it('strips ```json code fence', () => {
      const result = parseTitleResponse('```json\n{"title":"블록 분쇄자","rarity":"legendary"}\n```');
      expect(result).toEqual({ title: '블록 분쇄자', rarity: 'legendary' });
    });

    it('coerces unknown rarity to common', () => {
      const result = parseTitleResponse('{"title":"테스트","rarity":"mythic"}');
      expect(result).toEqual({ title: '테스트', rarity: 'common' });
    });

    it('falls back to first-line title with common rarity when JSON missing', () => {
      const result = parseTitleResponse('네트 위의 암살자');
      expect(result).toEqual({ title: '네트 위의 암살자', rarity: 'common' });
    });

    it('returns null for empty or whitespace-only input', () => {
      expect(parseTitleResponse('')).toBeNull();
      expect(parseTitleResponse('   ')).toBeNull();
    });

    it('returns null when JSON has empty title and no fallback line', () => {
      expect(parseTitleResponse('{"title":"","rarity":"epic"}')).toBeNull();
    });
  });
});
