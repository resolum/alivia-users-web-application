import { describe, expect, it } from 'vitest';
import { toIncident, type SupportIncidentResource } from './support-incidents-api.ts';

const resource: SupportIncidentResource = {
  id: 84, householdId: '3', deviceId: 104, reportedBy: 11,
  description: 'El sensor no detecta la ventana.', severity: 'MEDIUM', status: 'SCHEDULED', resolution: null,
  evidences: [{ url: 'https://res.cloudinary.com/a/sensor.jpg', publicId: 'incidents/sensor', attachedAt: '2026-11-02T09:31:00Z' }],
  statusHistory: [
    { status: 'OPEN', changedAt: '2026-11-02T09:30:00Z' },
    { status: 'SCHEDULED', changedAt: '2026-11-02T14:15:00Z' },
  ],
  visits: [{ orderId: 5, scheduledDate: '2026-11-04', startTime: '10:30', endTime: '12:00', technicianId: 2, technicianName: 'Santiago Vega', status: 'SCHEDULED' }],
  createdAt: '2026-11-02T09:30:00Z',
};

describe('toIncident', () => {
  it('maps the backend incident onto the support stages', () => {
    const incident = toIncident(resource);
    expect(incident).toMatchObject({
      id: '84', code: 'INC-2026-0084', stage: 'visit_scheduled', deviceLabel: 'Dispositivo 0104',
      stageDates: { registered: '2026-11-02T09:30:00Z', visit_scheduled: '2026-11-02T14:15:00Z' },
      visit: { start: '2026-11-04T10:30', technicianName: 'Santiago Vega' },
      remoteNote: null,
    });
    expect(incident.evidence[0]).toMatchObject({ name: 'sensor', url: 'https://res.cloudinary.com/a/sensor.jpg' });
  });

  it('says no visit is scheduled while the incident is open', () => {
    const open = toIncident({ ...resource, status: 'OPEN', visits: [], statusHistory: [] });
    expect(open.stage).toBe('registered');
    expect(open.remoteNote).toBe('Sin visita programada');
    expect(open.stageDates.registered).toBe(resource.createdAt);
  });
});
