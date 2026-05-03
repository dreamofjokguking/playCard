import { describe, expect, it } from 'vitest';
import { balancePosition, balanceTotal, randomBalance, topVsBottom, type PlayerScore } from './teamBalancer';

function playersOf(size: number): PlayerScore[] {
  return Array.from({ length: size }).map((_, index) => ({
    userId: `u${index + 1}`,
    total: 10 - index * 0.4,
    metrics: {
      attack: 10 - index * 0.3,
      defense: 6 + (index % 4)
    }
  }));
}

describe('teamBalancer', () => {
  it('balanceTotal keeps low gap for 6 players', () => {
    const players = playersOf(6);
    const result = balanceTotal(players);
    expect(result.teamA.length).toBe(3);
    expect(result.teamB.length).toBe(3);
    expect(result.gap).toBeLessThanOrEqual(1);
  });

  it('balanceTotal keeps low gap for 8 players', () => {
    const players = playersOf(8);
    const result = balanceTotal(players);
    expect(result.teamA.length).toBe(4);
    expect(result.teamB.length).toBe(4);
    expect(result.gap).toBeLessThanOrEqual(1.2);
  });

  it('balanceTotal keeps low gap for 10 players', () => {
    const players = playersOf(10);
    const result = balanceTotal(players);
    expect(result.teamA.length).toBe(5);
    expect(result.teamB.length).toBe(5);
    expect(result.gap).toBeLessThanOrEqual(1.5);
  });

  it('topVsBottom splits into two groups', () => {
    const players = playersOf(8);
    const result = topVsBottom(players);
    expect(result.teamA.length).toBe(4);
    expect(result.teamB.length).toBe(4);
    expect(result.teamA[0].total).toBeGreaterThanOrEqual(result.teamB[0].total);
  });

  it('balancePosition distributes strong attack players', () => {
    const players = playersOf(8);
    const result = balancePosition(players, 'attack');
    expect(result.teamA.length + result.teamB.length).toBe(8);
    const maxA = Math.max(...result.teamA.map((p) => p.metrics?.attack ?? 0));
    const maxB = Math.max(...result.teamB.map((p) => p.metrics?.attack ?? 0));
    expect(Math.abs(maxA - maxB)).toBeLessThanOrEqual(0.31);
  });

  it('randomBalance keeps same headcount with deterministic random', () => {
    const players = playersOf(6);
    let seed = 0;
    const randomFn = () => {
      seed = (seed + 0.37) % 1;
      return seed;
    };
    const result = randomBalance(players, randomFn);
    expect(result.teamA.length).toBe(3);
    expect(result.teamB.length).toBe(3);
  });
});
