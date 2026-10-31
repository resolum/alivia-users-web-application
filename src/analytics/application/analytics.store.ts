import type { AutonomySummary, MetricRange } from '../domain/model/autonomy-summary.ts';
import { getAnalyticsApi } from '../infrastructure/analytics-api.ts';

export const isAnalyticsSample = () => getAnalyticsApi().isSample;

export const loadAutonomySummary = (range: MetricRange): Promise<AutonomySummary> =>
  getAnalyticsApi().getAutonomySummary(range);
