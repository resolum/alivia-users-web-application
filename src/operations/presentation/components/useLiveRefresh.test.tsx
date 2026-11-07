// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RefreshButton } from './RefreshButton.tsx';
import { useLiveRefresh } from './useLiveRefresh.ts';

function Probe({ load, apply }: { readonly load: () => Promise<number>; readonly apply: (value: number) => void }) {
  const { refresh, refreshing } = useLiveRefresh(load, apply);
  return <RefreshButton refreshing={refreshing} onRefresh={() => void refresh()} />;
}

describe('useLiveRefresh', () => {
  afterEach(() => cleanup());

  it('reads again on demand and when the family comes back to the tab', async () => {
    const load = vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(5).mockRejectedValueOnce(new Error('offline'));
    const apply = vi.fn();
    render(<Probe load={load} apply={apply} />);

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Actualizar estado/ })); });
    expect(apply).toHaveBeenLastCalledWith(4);

    await act(async () => { window.dispatchEvent(new Event('focus')); });
    expect(apply).toHaveBeenLastCalledWith(5);

    await act(async () => { document.dispatchEvent(new Event('visibilitychange')); });
    expect(load).toHaveBeenCalledTimes(3);
    expect(apply).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: /Actualizar estado/ })).toBeTruthy();
  });

  it('shows that it is updating and ignores clicks meanwhile', async () => {
    let finish: (value: number) => void = () => undefined;
    const load = vi.fn(() => new Promise<number>((resolve) => { finish = resolve; }));
    render(<Probe load={load} apply={vi.fn()} />);

    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Actualizar estado/ })); });
    const busy = screen.getByRole('button', { name: /Actualizando/ });
    expect(busy.getAttribute('aria-busy')).toBe('true');
    await act(async () => { fireEvent.click(busy); });
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => { finish(1); });
    expect(screen.getByRole('button', { name: /Actualizar estado/ })).toBeTruthy();
  });
});
