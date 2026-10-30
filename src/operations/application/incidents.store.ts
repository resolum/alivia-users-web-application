import type { Incident, IncidentAddress } from '../domain/model/incident.entity.ts';
import type { ReportIncidentCommand } from '../domain/model/report-incident.command.ts';
import { getIncidentsApi, type ReportedDevice } from '../infrastructure/incidents-api.ts';

export type { ReportedDevice } from '../infrastructure/incidents-api.ts';

export const isIncidentsSample = () => getIncidentsApi().isSample;
export const loadIncidents = () => getIncidentsApi().listIncidents();
export const loadIncident = (id: string) => getIncidentsApi().getIncident(id);
export const requestVisitReschedule = (id: string) => getIncidentsApi().requestVisitReschedule(id);

export function reportIncident(
  command: ReportIncidentCommand,
  device: ReportedDevice,
  address: IncidentAddress,
): Promise<Incident> {
  if (Object.keys(command.validate()).length > 0) return Promise.reject(new Error('validation_failed'));
  return getIncidentsApi().reportIncident(command, device, address);
}
