// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthorizedState } from './StripePaymentStep.tsx';

const SLOT = { date: '2026-11-03', startTime: '09:00', endTime: '11:00', technicianId: 7, technicianName: 'Carla Mendoza', availableTechnicians: 1 };

function reply(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderAuthorized(withSlot = true) {
  if (withSlot) window.sessionStorage.setItem('alivia.evaluation-slot', JSON.stringify(SLOT));
  render(
    <MemoryRouter initialEntries={['/contract/configuration/payment']}>
      <Routes>
        <Route path="/contract/configuration/payment" element={<AuthorizedState draftId="d1" />} />
        <Route path="/contract/tracking" element={<p>Seguimiento</p>} />
        <Route path="/contract/evaluation/schedule" element={<p>Elegir franja</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthorizedState', () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });

  it('books the window chosen before paying and opens the tracking', async () => {
    const fetchMock = reply(201, { id: 4, draftId: 'd1', ...SLOT, contactName: null, contactPhone: null, directions: null });
    renderAuthorized();
    expect(await screen.findByText('Seguimiento')).toBeTruthy();
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1] as RequestInit).body as string) as Record<string, unknown>;
    expect(body).toMatchObject({ draftId: 'd1', date: '2026-11-03', technicianId: 7, contactName: null, directions: null });
  });

  it('opens the tracking when the visit was already booked', async () => {
    reply(409, { detail: 'This configuration already has a technical evaluation scheduled.' });
    renderAuthorized();
    expect(await screen.findByText('Seguimiento')).toBeTruthy();
  });

  it('asks for another window when it was taken meanwhile', async () => {
    reply(409, { detail: 'The selected window is no longer available.' });
    renderAuthorized();
    expect(await screen.findByText(/Ese horario acaba de ocuparse/)).toBeTruthy();
    screen.getByText('Elegir otra franja').click();
    expect(await screen.findByText('Elegir franja')).toBeTruthy();
  });

  it('offers to retry other failures and asks for a window when none was chosen', async () => {
    reply(500, { detail: 'Boom' });
    renderAuthorized();
    expect(await screen.findByText('Boom')).toBeTruthy();
    expect(screen.getByText('Reintentar la reserva')).toBeTruthy();
    cleanup();
    window.sessionStorage.clear();
    renderAuthorized(false);
    expect(await screen.findByText('Elegir franja')).toBeTruthy();
  });
});
