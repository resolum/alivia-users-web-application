import type { DeviceAction } from '../domain/model/device-action.ts';
import { getAnalyticsApi } from '../infrastructure/analytics-api.ts';

export const isAnalyticsSample = () => getAnalyticsApi().isSample;

export const loadDeviceActions = (): Promise<DeviceAction[]> => getAnalyticsApi().listActions();
