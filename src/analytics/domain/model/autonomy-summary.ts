export const METRIC_RANGES = ['today', 'week', 'month'] as const;
export type MetricRange = (typeof METRIC_RANGES)[number];

/** Actions in one bucket of the chart: a block of hours, a day or a week. */
export interface AutonomyBucket {
  readonly label: string;
  readonly autonomous: number;
  readonly assisted: number;
}

export interface DeviceUsage {
  readonly deviceName: string;
  /** Relative weight used to size the bar against the busiest device; units differ per device. */
  readonly amount: number;
  /** Already formatted, since the unit depends on the device ("4 h 20 min", "31 comandos"). */
  readonly amountLabel: string;
}

/** Read model of Analíticas: how much the assisted person did on their own. */
export interface AutonomySummary {
  readonly range: MetricRange;
  readonly generatedAt: string;
  readonly buckets: readonly AutonomyBucket[];
  readonly devices: readonly DeviceUsage[];
}

export function autonomyShare(summary: AutonomySummary): { autonomous: number; assisted: number; total: number } {
  const autonomous = summary.buckets.reduce((sum, bucket) => sum + bucket.autonomous, 0);
  const assisted = summary.buckets.reduce((sum, bucket) => sum + bucket.assisted, 0);
  return { autonomous, assisted, total: autonomous + assisted };
}

/** Whole percentage of autonomous actions, or null with no actions at all. */
export function autonomyPercent(summary: AutonomySummary): number | null {
  const { autonomous, total } = autonomyShare(summary);
  return total === 0 ? null : Math.round((autonomous / total) * 100);
}
