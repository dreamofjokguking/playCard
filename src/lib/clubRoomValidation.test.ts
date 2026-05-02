import { describe, expect, it } from 'vitest';
import { isSportType, normalizeMetricInput } from './clubRoomValidation';

describe('clubRoomValidation', () => {
  it('accepts allowed sport types', () => {
    expect(isSportType('jokgu')).toBe(true);
    expect(isSportType('soccer')).toBe(true);
    expect(isSportType('baseball')).toBe(true);
    expect(isSportType('etc')).toBe(true);
  });

  it('rejects disallowed sport types', () => {
    expect(isSportType('basketball')).toBe(false);
  });

  it('rejects duplicate metric keys', () => {
    const result = normalizeMetricInput([
      { key: 'attack', label: '공격' },
      { key: 'attack', label: '공격2' }
    ]);
    expect(result.ok).toBe(false);
  });

  it('normalizes metric order and trim', () => {
    const result = normalizeMetricInput([{ key: ' attack ', label: ' 공격 ' }]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0]).toMatchObject({
        key: 'attack',
        label: '공격',
        order: 1,
        isActive: true
      });
    }
  });
});
