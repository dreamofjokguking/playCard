export type PlayerScore = {
  userId: string;
  total: number;
  metrics?: Record<string, number>;
};

export type TeamBalanceResult = {
  teamA: PlayerScore[];
  teamB: PlayerScore[];
  teamATotal: number;
  teamBTotal: number;
  gap: number;
};

function sumTeam(players: PlayerScore[]): number {
  return players.reduce((sum, player) => sum + player.total, 0);
}

function makeResult(teamA: PlayerScore[], teamB: PlayerScore[]): TeamBalanceResult {
  const teamATotal = sumTeam(teamA);
  const teamBTotal = sumTeam(teamB);
  return {
    teamA,
    teamB,
    teamATotal,
    teamBTotal,
    gap: Math.abs(teamATotal - teamBTotal)
  };
}

export function balanceTotal(players: PlayerScore[]): TeamBalanceResult {
  if (players.length < 2) return makeResult(players, []);
  const sizeA = Math.floor(players.length / 2);

  let best: TeamBalanceResult | null = null;
  const n = players.length;
  const limit = 1 << n;

  for (let mask = 0; mask < limit; mask += 1) {
    const teamA: PlayerScore[] = [];
    const teamB: PlayerScore[] = [];
    for (let i = 0; i < n; i += 1) {
      if (mask & (1 << i)) teamA.push(players[i]);
      else teamB.push(players[i]);
    }
    if (teamA.length !== sizeA) continue;
    const result = makeResult(teamA, teamB);
    if (!best || result.gap < best.gap) {
      best = result;
    }
  }

  return best ?? makeResult(players.slice(0, sizeA), players.slice(sizeA));
}

export function topVsBottom(players: PlayerScore[]): TeamBalanceResult {
  const sorted = [...players].sort((a, b) => b.total - a.total);
  const pivot = Math.floor(sorted.length / 2);
  return makeResult(sorted.slice(0, pivot), sorted.slice(pivot));
}

export function randomBalance(players: PlayerScore[], randomFn: () => number = Math.random): TeamBalanceResult {
  const shuffled = [...players];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const pivot = Math.floor(shuffled.length / 2);
  return makeResult(shuffled.slice(0, pivot), shuffled.slice(pivot));
}

export function balancePosition(players: PlayerScore[], metricKey: string): TeamBalanceResult {
  const sorted = [...players].sort((a, b) => {
    const av = a.metrics?.[metricKey] ?? 0;
    const bv = b.metrics?.[metricKey] ?? 0;
    return bv - av;
  });
  const teamA: PlayerScore[] = [];
  const teamB: PlayerScore[] = [];
  sorted.forEach((player, index) => {
    if (index % 2 === 0) teamA.push(player);
    else teamB.push(player);
  });
  return makeResult(teamA, teamB);
}

