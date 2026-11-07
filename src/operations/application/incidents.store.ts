import { loadHomeDevices } from '@/tracking/index.ts';
import { openIncidentOf, type Incident, type IncidentAddress } from '../domain/model/incident.entity.ts';
import type { ReportIncidentCommand } from '../domain/model/report-incident.command.ts';
import { getIncidentsApi, type ReportForm, type ReportOutcome } from '../infrastructure/incidents-api.ts';
import type { ReportedDevice } from '../infrastructure/incidents-api.ts';

export type { ReportedDevice, ReportForm, ReportOutcome } from '../infrastructure/incidents-api.ts';
export { IncidentActionUnavailableError } from '../infrastructure/incidents-api.ts';

export const isIncidentsSample = () => getIncidentsApi().isSample;
export const loadIncidents = () => getIncidentsApi().listIncidents();
export const loadIncident = (id: string) => getIncidentsApi().getIncident(id);
/** Devices the family can report and whether a photo can be attached; the sample source uses the sample home. */
export async function loadReportForm(): Promise<ReportForm> {
  const form = await getIncidentsApi().loadReportForm();
  if (form !== null) return form;
  const home = await loadHomeDevices();
  return {
    photoUploadEnabled: true,
    devices: home.devices.map((device) => ({ id: device.id, code: device.code, name: device.name, roomName: device.roomName, kind: device.kind })),
  };
}

/**
 * The open incident of a device, so the form shows it instead of a duplicate. When the backend rejected the
 * report as a duplicate, {@code knownId} is the incident it pointed at.
 */
export async function loadOpenIncidentOf(deviceId: string, knownId: string | null = null): Promise<Incident | null> {
  if (knownId !== null) return getIncidentsApi().getIncident(knownId);
  return openIncidentOf(await getIncidentsApi().listIncidents(), deviceId);
}

export const requestVisitReschedule = (id: string) => getIncidentsApi().requestVisitReschedule(id);

export function reportIncident(
  command: ReportIncidentCommand,
  device: ReportedDevice,
  address: IncidentAddress,
): Promise<ReportOutcome> {
  if (Object.keys(command.validate()).length > 0) return Promise.reject(new Error('validation_failed'));
  return getIncidentsApi().reportIncident(command, device, address);
}
