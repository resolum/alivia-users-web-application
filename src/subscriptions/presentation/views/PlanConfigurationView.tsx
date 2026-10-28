import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, Check, DoorOpen, Grid2x2, Lightbulb, Mic, Plus, Wrench, X, type LucideIcon } from 'lucide-react';
import { currentChosenSlot, formatLongDate, InstallationDateStep } from '@/operations/index.ts';
import { changeDeviceQuantity, loadHomeConfiguration, replaceConfiguredRooms } from '../../application/home-configuration.store.ts';
import type { DeviceType, HomeConfiguration, RoomConfiguration } from '../../domain/model/home-configuration.ts';
import { readPlanSelection } from '../../infrastructure/plan-selection.storage.ts';
import { ConfigurationProgress } from '../components/ConfigurationProgress.tsx';
import { ConfigurationSubsteps, type ConfigurationSubstep } from '../components/ConfigurationSubsteps.tsx';
import { ContractBrand } from '../components/ContractBrand.tsx';
import { StripePaymentStep } from '../components/StripePaymentStep.tsx';

const VALID_STEPS: readonly ConfigurationSubstep[] = ['rooms', 'devices', 'installation', 'summary', 'payment'];
const MAX_ROOMS = 3;
const EMPTY_DEVICES = { LIGHT: 0, DOOR: 0, WINDOW: 0, CURTAIN: 0, MICROPHONE: 1 } as const;
const DEVICES: readonly { type: DeviceType; icon: LucideIcon; name: string; description: string }[] = [
  { type: 'LIGHT', icon: Lightbulb, name: 'Iluminación', description: 'Encendido gradual nocturno y control adaptativo.' },
  { type: 'DOOR', icon: DoorOpen, name: 'Puerta', description: 'Apertura y cierre asistido sin esfuerzo físico.' },
  { type: 'WINDOW', icon: Grid2x2, name: 'Ventana', description: 'Control seguro de apertura y ventilación.' },
  { type: 'MICROPHONE', icon: Mic, name: 'Micrófono asistencial', description: 'Canal de voz bidireccional y detección de emergencias.' },
];

interface RoomsStepProps {
  readonly configuration: HomeConfiguration;
  readonly saving: boolean;
  readonly onSave: (rooms: readonly RoomConfiguration[]) => Promise<void>;
}

function RoomsStep({ configuration, saving, onSave }: RoomsStepProps) {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState(configuration.rooms);
  const minimumRooms = configuration.planCode === 'CUSTOM' ? 2 : 1;
  const addRoom = () => {
    const next = [...rooms, { id: crypto.randomUUID(), name: `Habitación ${rooms.length + 1}`, devices: EMPTY_DEVICES }];
    setRooms(next);
    void onSave(next).catch(() => undefined);
  };
  const removeRoom = (id: string) => {
    if (rooms.length <= minimumRooms) return;
    const next = rooms.filter((room) => room.id !== id);
    setRooms(next);
    void onSave(next).catch(() => undefined);
  };
  const continueToDevices = () => void onSave(rooms)
    .then(() => navigate('/contract/configuration/devices'))
    .catch(() => undefined);

  return <section className="mx-auto mt-7 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-8">
    <p className="text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">CONFIGURACIÓN — 1 DE 3</p>
    <h1 className="mt-1 text-3xl font-extrabold text-alivia-primary">Selecciona los espacios</h1>
    <p className="mt-2 text-sm text-alivia-text-muted">Agrega las habitaciones que deseas adaptar con asistencia inteligente.</p>
    <div className="mt-7 space-y-3">{rooms.map((room, index) => <div key={room.id} className="flex items-center gap-3 rounded-xl bg-alivia-primary-mist/60 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-alivia-primary"><BedDouble aria-hidden="true" className="size-5" /></span><div className="min-w-0 flex-1"><input aria-label={`Nombre de ${room.name}`} value={room.name} onChange={(event) => setRooms((current) => current.map((item) => item.id === room.id ? { ...item, name: event.target.value } : item))} onBlur={() => void onSave(rooms).catch(() => undefined)} className="w-full rounded-md bg-transparent px-1 py-1 font-bold text-alivia-primary focus:bg-white"/><p className="text-xs text-alivia-text-muted">{index === 0 ? 'Espacio principal de descanso' : 'Ambiente adicional configurado'}</p></div>{index === 0 && <span className="hidden rounded-full bg-alivia-secondary-light px-2 py-1 text-[0.65rem] font-bold text-alivia-secondary-deep sm:inline">1er espacio</span>}<button type="button" disabled={rooms.length <= minimumRooms} onClick={() => removeRoom(room.id)} aria-label={`Quitar ${room.name}`} className="grid size-9 place-items-center text-slate-500 disabled:opacity-30"><X aria-hidden="true" className="size-4" /></button></div>)}</div>
    <button type="button" disabled={rooms.length >= MAX_ROOMS || saving} onClick={addRoom} className="mt-4 min-h-11 w-full rounded-xl border border-dashed border-alivia-secondary-dark text-sm font-bold text-alivia-secondary-deep disabled:cursor-not-allowed disabled:opacity-50"><Plus aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px]" />{rooms.length >= MAX_ROOMS ? `Máximo ${MAX_ROOMS} habitaciones` : 'Agregar otra habitación'}</button>
    <div className="mt-5 flex justify-between rounded-xl bg-alivia-primary-mist/70 px-4 py-3 text-sm"><strong>{rooms.length} habitaciones seleccionadas</strong><span className="text-xs font-bold text-alivia-secondary-deep">{saving ? 'Guardando…' : <><Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />Guardado en Alivia</>}</span></div>
    <div className="mt-6 flex justify-between gap-3"><Link to="/plans" className="rounded-lg bg-alivia-primary-mist px-5 py-3 text-sm font-bold text-alivia-primary"><ArrowLeft aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px]" />Atrás</Link><button type="button" disabled={saving || rooms.some((room) => room.name.trim() === '')} onClick={continueToDevices} className="rounded-lg bg-alivia-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-50">Elegir dispositivos<ArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-3px]" /></button></div>
  </section>;
}

interface DevicesStepProps {
  readonly configuration: HomeConfiguration;
  readonly saving: boolean;
  readonly onChange: (roomId: string, type: DeviceType, quantity: number) => Promise<void>;
}

function DevicesStep({ configuration, saving, onChange }: DevicesStepProps) {
  const navigate = useNavigate();
  const [activeRoomId, setActiveRoomId] = useState(configuration.rooms[0]?.id ?? '');
  const room = configuration.rooms.find((item) => item.id === activeRoomId) ?? configuration.rooms[0];
  const actuators = configuration.rooms.reduce((total, item) => total + item.devices.LIGHT + item.devices.DOOR + item.devices.WINDOW + item.devices.CURTAIN, 0);
  const maximumActuators = configuration.planCode === 'MINIMUM' ? 1 : 4;
  const valid = actuators >= 1 && actuators <= maximumActuators;

  return <section className="mx-auto mt-7 max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-8">
    <p className="text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">CONFIGURACIÓN — 2 DE 3</p><h1 className="mt-1 text-3xl font-extrabold text-alivia-primary">Configura cada habitación</h1><p className="mt-2 text-sm text-alivia-text-muted">Selecciona hasta cuatro actuadores para todo el hogar. El micrófono está incluido en cada habitación.</p>
    <div className="mt-6 flex gap-2 overflow-x-auto pb-2">{configuration.rooms.map((item) => <button key={item.id} type="button" onClick={() => setActiveRoomId(item.id)} className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-bold ${item.id === room?.id ? 'bg-alivia-primary text-white' : 'bg-alivia-primary-mist text-alivia-text-muted'}`}>{item.name}</button>)}</div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{DEVICES.map((device) => { const quantity = room?.devices[device.type] ?? 0; const fixed = device.type === 'MICROPHONE'; return <article key={device.type} className={`rounded-2xl border-2 p-5 ${quantity > 0 ? 'border-alivia-secondary-dark bg-alivia-mint/30' : 'border-slate-200 bg-slate-50'}`}><div className="flex justify-between"><span className="grid size-10 place-items-center rounded-xl bg-alivia-secondary-light text-alivia-secondary-deep"><device.icon aria-hidden="true" className="size-5" /></span><span className={`inline-flex h-6 items-center gap-1.5 self-start rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset ${quantity > 0 ? 'bg-alivia-mint text-alivia-secondary-deep ring-alivia-secondary-dark/30' : 'bg-slate-100 text-slate-500 ring-slate-200'}`}><span aria-hidden="true" className={`size-1.5 rounded-full ${quantity > 0 ? 'bg-alivia-secondary-dark' : 'bg-slate-400'}`} />{quantity > 0 ? 'Activo' : 'Desactivado'}</span></div><h2 className="mt-3 text-xl font-extrabold text-alivia-primary">{device.name}</h2><p className="mt-1 min-h-10 text-sm text-alivia-text-muted">{device.description}</p><div className="mt-4 flex items-center justify-end rounded-xl bg-white px-3 py-2">{fixed ? <span className="rounded-full bg-alivia-primary-mist px-3 py-1 text-xs font-bold text-alivia-primary">1 incluido</span> : <div className="flex items-center gap-3"><button type="button" disabled={saving} aria-label={`Quitar ${device.name}`} onClick={() => room && void onChange(room.id, device.type, quantity - 1)} className="grid size-8 place-items-center rounded-lg border font-bold text-alivia-primary">−</button><strong>{quantity}</strong><button type="button" disabled={saving || actuators >= maximumActuators} aria-label={`Agregar ${device.name}`} onClick={() => room && void onChange(room.id, device.type, quantity + 1)} className="grid size-8 place-items-center rounded-lg border font-bold text-alivia-primary disabled:opacity-30">+</button></div>}</div></article>; })}</div>
    <div className="mt-5 flex flex-wrap justify-between gap-2 rounded-xl bg-alivia-primary-mist/70 px-4 py-3 text-sm"><span><strong>{actuators} de {maximumActuators} actuadores</strong> · {configuration.totalDevices} dispositivos totales</span><strong className="text-alivia-primary">{configuration.quote ? `S/ ${configuration.quote.totalMonthlyAmount} /mes` : 'Completa la selección'}</strong></div>
    <div className="mt-6 flex justify-between gap-3"><button type="button" onClick={() => navigate('/contract/configuration/rooms')} className="rounded-lg bg-alivia-primary-mist px-5 py-3 text-sm font-bold text-alivia-primary"><ArrowLeft aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px]" />Habitaciones</button><button type="button" disabled={!valid || saving} onClick={() => navigate('/contract/configuration/installation')} className="rounded-lg bg-alivia-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-50">Elegir fecha de instalación<ArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-3px]" /></button></div>
  </section>;
}

function SummaryStep({ configuration }: { readonly configuration: HomeConfiguration }) {
  const navigate = useNavigate();
  const quote = configuration.quote;
  const visit = currentChosenSlot();
  const names: Record<string, string> = { LIGHT: 'Iluminación', DOOR: 'Puerta', WINDOW: 'Ventana', CURTAIN: 'Cortina', MICROPHONE: 'Micrófono asistencial' };
  return <section className="mx-auto mt-7 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,42,107,0.07)] sm:p-8"><p className="text-xs font-extrabold tracking-[0.1em] text-alivia-secondary-deep">CONFIGURACIÓN — 3 DE 3</p><h1 className="mt-1 text-3xl font-extrabold text-alivia-primary">Revisa tu configuración</h1><p className="mt-2 text-sm text-alivia-text-muted">Valida los espacios y equipos antes de continuar al pago.</p><div className="mt-6 rounded-xl bg-alivia-primary-mist/70 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="rounded-full bg-alivia-primary px-3 py-1 text-xs font-bold text-white">{configuration.planCode === 'CUSTOM' ? 'Plan Personalizado' : 'Plan Base'}</span><p className="mt-3 text-sm text-alivia-text-muted">{configuration.rooms.length} habitaciones · {configuration.totalDevices} dispositivos</p></div><div className="text-right"><span className="text-xs font-bold text-slate-500">IMPORTE ESTIMADO</span><p className="text-2xl font-extrabold text-alivia-primary">{quote ? `S/ ${quote.totalMonthlyAmount}` : 'Por calcular'} <small className="text-sm">/mes</small></p></div></div></div><h2 className="mt-6 text-xs font-bold tracking-wider text-slate-500">DISTRIBUCIÓN POR AMBIENTE</h2><div className="mt-3 space-y-3">{configuration.rooms.map((room) => <details key={room.id} open className="rounded-xl border border-slate-200"><summary className="cursor-pointer px-4 py-4 font-bold text-alivia-primary"><BedDouble aria-hidden="true" className="mr-2 inline size-5 align-[-4px]" />{room.name}</summary><ul className="border-t px-5 py-3 text-sm">{Object.entries(room.devices).filter(([, quantity]) => quantity > 0).map(([type, quantity]) => <li key={type} className="flex justify-between py-1.5"><span>{names[type]}</span><strong>{quantity} {quantity === 1 ? 'unidad' : 'unidades'}</strong></li>)}</ul></details>)}</div>{quote && <div className="mt-5 grid gap-2 rounded-xl border p-4 text-sm"><div className="flex justify-between"><span>Base del plan</span><strong>S/ {quote.baseMonthlyAmount}</strong></div><div className="flex justify-between"><span>Habitaciones adicionales</span><strong>S/ {quote.additionalRoomsMonthlyAmount}</strong></div><div className="flex justify-between"><span>Dispositivos</span><strong>S/ {quote.devicesMonthlyAmount}</strong></div><div className="mt-1 flex justify-between border-t pt-3 text-base text-alivia-primary"><strong>Total mensual estimado</strong><strong>S/ {quote.totalMonthlyAmount}</strong></div></div>}<h2 className="mt-6 text-xs font-bold tracking-wider text-slate-500">FECHA DE INSTALACIÓN</h2>{visit === null ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span>Aún no eliges cuándo te visitamos.</span><button type="button" onClick={() => navigate('/contract/configuration/installation')} className="font-bold underline underline-offset-2">Elegir fecha</button></div> : <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm"><div className="grid gap-1"><span className="font-bold text-alivia-primary"><CalendarDays aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px] text-alivia-secondary-dark" />{formatLongDate(visit.date)} · {visit.startTime} – {visit.endTime}</span><span className="text-alivia-text-muted"><Wrench aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px]" />Técnico: {visit.technicianName}</span></div><button type="button" onClick={() => navigate('/contract/configuration/installation')} className="font-bold text-alivia-secondary-deep underline underline-offset-2">Cambiar</button></div>}<div className="mt-5 rounded-xl bg-alivia-mint px-4 py-3 text-sm text-alivia-secondary-deep"><strong>Cobro transparente:</strong> el importe final se confirmará después de la evaluación técnica.</div><div className="mt-6 flex flex-wrap justify-between gap-3"><button type="button" onClick={() => navigate('/contract/configuration/installation')} className="rounded-lg bg-alivia-primary-mist px-5 py-3 text-sm font-bold text-alivia-primary"><ArrowLeft aria-hidden="true" className="mr-1.5 inline size-4 align-[-3px]" />Fecha de instalación</button><button type="button" disabled={quote === null || visit === null} onClick={() => navigate('/contract/configuration/payment')} className="rounded-lg bg-alivia-primary px-6 py-3 text-sm font-bold text-white disabled:opacity-50">Continuar al pago<ArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-3px]" /></button></div></section>;
}

export function PlanConfigurationView() {
  const navigate = useNavigate();
  const selection = readPlanSelection();
  const draftId = selection?.draftId;
  const planCode = selection?.planCode;
  const billingPeriod = selection?.billingPeriod;
  const amount = selection?.amount;
  const selectedAt = selection?.selectedAt;
  const params = useParams<{ substep: string }>();
  const substep = VALID_STEPS.includes(params.substep as ConfigurationSubstep) ? params.substep as ConfigurationSubstep : null;
  const [configuration, setConfiguration] = useState<HomeConfiguration | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (draftId === undefined || planCode === undefined || billingPeriod === undefined
      || amount === undefined || selectedAt === undefined) return;
    let active = true;
    void loadHomeConfiguration({ draftId, planCode, billingPeriod, amount, selectedAt }).then((value) => {
      if (active) {
        setConfiguration(value);
        setError(null);
      }
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar la configuración.'); });
    return () => { active = false; };
  }, [amount, billingPeriod, draftId, planCode, selectedAt]);

  if (selection === null) return <Navigate to="/plans" replace />;
  if (substep === null) return <Navigate to={selection.planCode === 'MINIMUM' ? '/contract/configuration/installation' : '/contract/configuration/rooms'} replace />;

  const saveRooms = async (rooms: readonly RoomConfiguration[]) => { if (configuration === null) return; setSaving(true); setError(null); try { setConfiguration(await replaceConfiguredRooms(configuration, rooms)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron guardar los cambios.'); throw reason; } finally { setSaving(false); } };
  const changeDevice = async (roomId: string, type: DeviceType, quantity: number) => { if (configuration === null) return; setSaving(true); setError(null); try { setConfiguration(await changeDeviceQuantity(configuration, roomId, type, quantity)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'No se pudieron guardar los dispositivos.'); } finally { setSaving(false); } };

  return <div className="min-h-screen bg-[#f7f7fc] text-alivia-text"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-5 py-3 lg:px-8"><ContractBrand /><Link to="/plans" className="text-sm font-bold text-alivia-primary hover:underline">Cambiar plan</Link></div></header><main className="mx-auto max-w-6xl px-5 py-7 lg:px-8 lg:py-9"><ConfigurationProgress /><ConfigurationSubsteps current={substep} />{error && <div role="alert" className="mx-auto mt-5 max-w-4xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}{configuration === null ? <div className="grid min-h-80 place-items-center text-sm text-alivia-text-muted">Cargando configuración desde Alivia…</div> : substep === 'rooms' ? <RoomsStep configuration={configuration} saving={saving} onSave={saveRooms} /> : substep === 'devices' ? <DevicesStep configuration={configuration} saving={saving} onChange={changeDevice} /> : substep === 'payment' ? <StripePaymentStep configuration={configuration} /> : substep === 'installation' ? <InstallationDateStep back={configuration.planCode === 'CUSTOM' ? { label: 'Dispositivos', action: () => void navigate('/contract/configuration/devices') } : { label: 'Cambiar plan', action: () => void navigate('/plans') }} onContinue={() => void navigate('/contract/configuration/summary')} /> : <SummaryStep configuration={configuration} />}</main></div>;
}
