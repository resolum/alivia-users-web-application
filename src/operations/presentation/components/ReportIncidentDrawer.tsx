import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, Send, X } from 'lucide-react';
import { loadHousehold } from '@/profiles/index.ts';
import { Button, Drawer, Field, inputBase } from '@/shared/presentation/components/ui/index.ts';
import { loadHomeDevices, type Device } from '@/tracking/index.ts';
import { reportIncident } from '../../application/incidents.store.ts';
import { PROBLEM_TYPES, type Incident, type ProblemType } from '../../domain/model/incident.entity.ts';
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  ReportIncidentCommand,
  type ReportFieldError,
  type ReportPhoto,
} from '../../domain/model/report-incident.command.ts';
import { PROBLEM_LABELS } from '../incident-presentation.ts';

const ERROR_TEXT: Record<ReportFieldError, string> = {
  required: 'Este campo es obligatorio.',
  too_short: `Cuéntanos un poco más (al menos ${DESCRIPTION_MIN} caracteres).`,
  too_long: `Usa como máximo ${DESCRIPTION_MAX} caracteres.`,
  invalid_photo: 'Adjunta una imagen JPG o PNG de hasta 2 MB.',
};

function readPhoto(file: File): Promise<ReportPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

interface ReportIncidentDrawerProps {
  readonly open: boolean;
  readonly initialDeviceId: string;
  readonly initialType: ProblemType | '';
  readonly onClose: () => void;
  readonly onReported: (incident: Incident) => void;
}

export function ReportIncidentDrawer({ open, initialDeviceId, initialType, onClose, onReported }: ReportIncidentDrawerProps) {
  const [devices, setDevices] = useState<readonly Device[] | null>(null);
  const [deviceId, setDeviceId] = useState(initialDeviceId);
  const [problemType, setProblemType] = useState<ProblemType | ''>(initialType);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<ReportPhoto | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDeviceId(initialDeviceId);
      setProblemType(initialType);
      setDescription('');
      setPhoto(null);
      setSubmitted(false);
      setFailed(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    let active = true;
    loadHomeDevices().then(
      (home) => active && setDevices(home.devices),
      () => active && setDevices([]),
    );
    return () => {
      active = false;
    };
  }, [open]);

  const command = new ReportIncidentCommand(deviceId, problemType, description, photo);
  const errors = submitted ? command.validate() : {};
  const errorOf = (field: keyof typeof errors) => (errors[field] ? ERROR_TEXT[errors[field]] : null);

  const pickPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) setPhoto(await readPhoto(file));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const device = devices?.find((item) => item.id === deviceId);
    if (Object.keys(command.validate()).length > 0 || !device) return;
    setSending(true);
    setFailed(false);
    try {
      const household = await loadHousehold();
      const incident = await reportIncident(
        command,
        { id: device.id, code: device.code, name: device.name, roomName: device.roomName, kind: device.kind },
        {
          line: household.address.line,
          district: [household.address.district, household.address.city].filter(Boolean).join(', '),
          reference: household.address.reference,
        },
      );
      onReported(incident);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  const selectClass = `${inputBase} min-h-11`;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Reportar incidencia"
      description="Cuéntanos qué falla y el equipo técnico coordinará la atención."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="report-incident" loading={sending} disabled={devices === null}>
            Enviar reporte
            <Send className="size-4" aria-hidden="true" />
          </Button>
        </>
      }
    >
      <form id="report-incident" noValidate onSubmit={submit} className="flex flex-col gap-5">
        <Field id="report-device" label="Dispositivo afectado" required error={errorOf('deviceId')}>
          {(describedBy) => (
            <select
              id="report-device"
              value={deviceId}
              onChange={(event) => setDeviceId(event.target.value)}
              disabled={devices === null}
              aria-invalid={Boolean(errors.deviceId)}
              aria-describedby={describedBy}
              className={selectClass}
            >
              <option value="" disabled>
                {devices === null ? 'Cargando dispositivos…' : 'Elige el dispositivo'}
              </option>
              {devices?.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} · {device.roomName}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field id="report-type" label="Tipo de problema" required error={errorOf('problemType')}>
          {(describedBy) => (
            <select
              id="report-type"
              value={problemType}
              onChange={(event) => setProblemType(event.target.value as ProblemType)}
              aria-invalid={Boolean(errors.problemType)}
              aria-describedby={describedBy}
              className={selectClass}
            >
              <option value="" disabled>
                Elige el tipo
              </option>
              {PROBLEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROBLEM_LABELS[type]}
                </option>
              ))}
            </select>
          )}
        </Field>

        <Field
          id="report-description"
          label="¿Qué está pasando?"
          required
          hint="Desde cuándo ocurre y qué notaste. Ayuda al técnico a llegar con lo necesario."
          error={errorOf('description')}
          aside={
            <span className={`text-xs tabular-nums ${description.trim().length > DESCRIPTION_MAX ? 'text-alivia-danger' : 'text-alivia-hint'}`}>
              {description.trim().length}/{DESCRIPTION_MAX}
            </span>
          }
        >
          {(describedBy) => (
            <textarea
              id="report-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={describedBy}
              placeholder="Ejemplo: el sensor no detecta la apertura de la ventana desde anoche."
              className={`${inputBase} resize-y`}
            />
          )}
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-alivia-primary-dark">Foto del dispositivo (opcional)</span>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={pickPhoto} className="sr-only" tabIndex={-1} aria-hidden="true" />
          {photo ? (
            <div className="flex items-center gap-3 rounded-xl border border-alivia-primary-mist p-2">
              <img src={photo.dataUrl} alt="" className="size-14 rounded-lg object-cover" />
              <p className="min-w-0 flex-1 truncate text-sm text-alivia-text">{photo.name}</p>
              <button
                type="button"
                onClick={() => setPhoto(null)}
                aria-label="Quitar foto"
                className="grid size-11 place-items-center rounded-lg text-alivia-text-muted hover:bg-alivia-page"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-alivia-primary-light/70 text-sm font-semibold text-alivia-primary-dark transition-colors hover:bg-alivia-page"
            >
              <ImagePlus className="size-5" aria-hidden="true" />
              Adjuntar foto
              <span className="text-xs font-normal text-alivia-hint">JPG o PNG, hasta 2 MB</span>
            </button>
          )}
          {errors.photo && <p className="text-xs font-semibold text-alivia-danger">{errorOf('photo')}</p>}
        </div>

        {failed && (
          <p role="alert" className="rounded-lg bg-alivia-danger/10 px-3 py-2 text-sm text-alivia-danger">
            No pudimos enviar el reporte. Revisa tu conexión e inténtalo de nuevo.
          </p>
        )}
      </form>
    </Drawer>
  );
}
