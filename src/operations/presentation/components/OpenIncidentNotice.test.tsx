// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Incident, type IncidentProps } from '../../domain/model/incident.entity.ts';
import { OpenIncidentNotice } from './OpenIncidentNotice.tsx';

const props: IncidentProps = {
  id: '84', code: 'INC-2026-0084', deviceId: 'AA:AA:AA:AA:AA:AA', deviceName: 'Sensor de ventana', deviceCode: 'DEV-0001',
  deviceKind: 'window_sensor', roomName: 'Sensor', problemType: 'battery', description: 'La batería marca alerta baja.',
  reportedAt: '2026-11-04T15:00:00Z', stage: 'evaluating', stageDates: {}, visit: null, attentionNote: null, remoteNote: null,
  resolutionNote: null, address: { line: '', district: '', reference: '' }, evidence: [],
};

describe('OpenIncidentNotice', () => {
  afterEach(() => cleanup());

  it('shows the incident in course of the device and links to its tracking', () => {
    const onOpen = vi.fn();
    render(<MemoryRouter><OpenIncidentNotice incident={new Incident(props)} onOpen={onOpen} /></MemoryRouter>);

    expect(screen.getByText('Este dispositivo ya tiene una incidencia abierta')).toBeTruthy();
    expect(screen.getByText('INC-2026-0084')).toBeTruthy();
    const link = screen.getByRole('link', { name: /Ver seguimiento/ });
    expect(link.getAttribute('href')).toBe('/incidents/84');
    fireEvent.click(link);
    expect(onOpen).toHaveBeenCalled();
  });
});
