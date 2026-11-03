// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InstallationDateStep } from './InstallationDateStep.tsx';

const slot = (date: string, startTime: string, endTime: string, technicianId: number, technicianName: string) =>
  ({ date, startTime, endTime, technicianId, technicianName, availableTechnicians: 2 });
const SLOTS = [
  slot('2026-11-04', '08:00', '10:00', 7, 'Carla Mendoza'),
  slot('2026-11-04', '08:00', '10:00', 8, 'Luis Rojas'),
  slot('2026-11-04', '10:00', '12:00', 8, 'Luis Rojas'),
  slot('2026-11-05', '14:00', '16:00', 9, 'Ana Pérez'),
];

function serve(holdStatus: number) {
  const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>((url) => Promise.resolve(url.includes('/holds/')
    ? new Response(JSON.stringify(holdStatus === 200 ? { draftId: 'd1', expiresAt: '2026-11-03T15:30:00Z' } : { detail: 'The selected window is no longer available. Choose another one.' }), { status: holdStatus })
    : new Response(JSON.stringify(SLOTS), { status: 200 })));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function pickLuisAtEight() {
  fireEvent.click(await screen.findByRole('radio', { name: /08:00 – 10:00/ }));
  fireEvent.click(screen.getByRole('radio', { name: /Luis Rojas/ }));
  fireEvent.click(screen.getByRole('button', { name: /Separar y revisar/ }));
}

describe('InstallationDateStep', () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });

  it('splits each window among its technicians and holds the one the family picks', async () => {
    const fetchMock = serve(200);
    const onContinue = vi.fn();
    render(<InstallationDateStep draftId="d1" back={{ label: 'Volver', action: vi.fn() }} onContinue={onContinue} />);

    expect(await screen.findByText('2 técnicos libres')).toBeTruthy();
    expect(screen.getByText('Elige una franja para ver los técnicos libres en ese horario.')).toBeTruthy();
    await pickLuisAtEight();

    await waitFor(() => expect(onContinue).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]?.[0]).toContain('available-slots?draftId=d1');
    const hold = fetchMock.mock.calls.find(([url]) => url.includes('/holds/d1'));
    expect(JSON.parse(hold?.[1]?.body as string)).toEqual({ date: '2026-11-04', startTime: '08:00', endTime: '10:00', technicianId: 8 });
    expect(JSON.parse(window.sessionStorage.getItem('alivia.evaluation-slot') ?? '{}')).toMatchObject({ technicianName: 'Luis Rojas' });
  });

  it('asks for another window when another family held it first', async () => {
    serve(409);
    const onContinue = vi.fn();
    render(<InstallationDateStep draftId="d1" back={{ label: 'Volver', action: vi.fn() }} onContinue={onContinue} />);

    await pickLuisAtEight();

    expect(await screen.findByText(/Otra familia acaba de separar ese horario/)).toBeTruthy();
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('changes the windows with the day', async () => {
    serve(200);
    render(<InstallationDateStep draftId="d1" back={{ label: 'Volver', action: vi.fn() }} onContinue={vi.fn()} />);

    fireEvent.click(await screen.findByRole('radio', { name: /jue.*5/i }));

    expect(await screen.findByRole('radio', { name: /14:00 – 16:00/ })).toBeTruthy();
    expect(screen.queryByRole('radio', { name: /08:00 – 10:00/ })).toBeNull();
  });
});
