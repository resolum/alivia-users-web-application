import type { HomeDevices } from '../domain/model/device.entity.ts';
import { getTrackingApi } from '../infrastructure/tracking-api.ts';

export const isTrackingSample = () => getTrackingApi().isSample;

export const loadHomeDevices = (): Promise<HomeDevices> => getTrackingApi().getHomeDevices();
