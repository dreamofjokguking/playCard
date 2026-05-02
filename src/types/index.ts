export type UserRole = 'service_admin' | 'member' | 'pending' | 'admin';
export type UserStatus = 'active' | 'inactive';
export type MatchStatus = 'evaluating' | 'completed' | 'cancelled';

export type PositionMetricStat = {
  metricKey: string;
  avg: number;
  count: number;
};

export type MatchPlayerStat = {
  userId: string;
  metricStats: PositionMetricStat[];
  overall: number;
  absences: string[];
  mvpCount: number;
  comments: string[];
};
