import type { HomeDevices } from '../domain/model/device.entity.ts';
import { getTrackingApi } from '../infrastructure/tracking-api.ts';

export const isTrackingSample = () => getTrackingApi().isSample;

export const loadHomeDevices = (): Promise<HomeDevices> => getTrackingApi().getHomeDevices();

export class SupervisionForbiddenError extends Error {
  constructor() {
    super('forbidden');
    this.name = 'SupervisionForbiddenError';
  }
}

/** Remote supervision: device state and recent events, only for caregivers allowed to see devices. */
export function loadSupervision(viewer: { can(responsibility: 'view_devices'): boolean }): Promise<HomeDevices> {
  if (!viewer.can('view_devices')) return Promise.reject(new SupervisionForbiddenError());
  return getTrackingApi().getHomeDevices();
}
