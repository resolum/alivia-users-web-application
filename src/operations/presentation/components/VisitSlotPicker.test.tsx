// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EvaluationSlot } from '../../domain/model/evaluation-slot.ts';
import { VisitSlotPicker } from './VisitSlotPicker.tsx';

const slot = (date: string, startTime: string, endTime: string, technicianId: number, technicianName: string) =>
  new EvaluationSlot({ date, startTime, endTime, technicianId, technicianName, availableTechnicians: 2 });
const SLOTS = [
  slot('2026-11-05', '08:00', '10:00', 7, 'Carla Mendoza'),
  slot('2026-11-05', '08:00', '10:00', 8, 'Luis Rojas'),
  slot('2026-11-06', '14:00', '16:00', 9, 'Ana Pérez'),
];

function Harness({ onChange }: { readonly onChange: (slot: EvaluationSlot | null) => void }) {
  const [value, setValue] = useState<EvaluationSlot | null>(null);
  return <VisitSlotPicker slots={SLOTS} error={null} value={value} onRetry={vi.fn()} onChange={(next) => { setValue(next); onChange(next); }} />;
}

describe('VisitSlotPicker', () => {
  afterEach(() => cleanup());

  it('lets the family choose the day, the window and who visits them', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    expect(screen.getByText('2 técnicos libres')).toBeTruthy();
    expect(screen.getByText('Elige una franja para ver los técnicos libres.')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /08:00 – 10:00/ }));
    fireEvent.click(screen.getByRole('radio', { name: /Luis Rojas/ }));

    expect(onChange).toHaveBeenLastCalledWith(SLOTS[1]);
    expect(screen.getByText(/Jueves 5 de noviembre, 2026 · 08:00 – 10:00/)).toBeTruthy();

    fireEvent.click(screen.getAllByRole('radio')[1] as HTMLElement);
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText('Elige día, franja y técnico.')).toBeTruthy();
  });

  it('tells while it loads, when it fails and when nobody is free', () => {
    const onRetry = vi.fn();
    const { rerender } = render(<VisitSlotPicker slots={null} error={null} value={null} onRetry={onRetry} onChange={vi.fn()} />);
    expect(screen.getByText('Buscando técnicos disponibles…')).toBeTruthy();

    rerender(<VisitSlotPicker slots={null} error="Sin conexión." value={null} onRetry={onRetry} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    rerender(<VisitSlotPicker slots={[]} error={null} value={null} onRetry={onRetry} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Volver a buscar' }));
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});
