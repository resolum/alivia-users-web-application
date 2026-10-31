import { addDays } from '@/shared/domain/model/valueobjects/relative-time.ts';
import { respond } from '@/shared/infrastructure/local-collection.ts';
import type { AutonomyBucket, AutonomySummary, DeviceUsage, MetricRange } from '../domain/model/autonomy-summary.ts';

export interface AnalyticsApi {
  readonly isSample: boolean;
  getAutonomySummary(range: MetricRange): Promise<AutonomySummary>;
}

/** Figma example week, Monday first. */
const WEEK: readonly [number, number][] = [
  [21, 4], [24, 3], [18, 5], [27, 6], [31, 4], [23, 2], [26, 3],
];

const DEVICES: Record<MetricRange, readonly DeviceUsage[]> = {
  today: [
    { deviceName: 'Luz del dormitorio', amount: 40, amountLabel: '40 min' },
    { deviceName: 'Micrófono asistencial', amount: 6, amountLabel: '6 comandos' },
    { deviceName: 'Puerta principal', amount: 2, amountLabel: '2 aperturas' },
    { deviceName: 'Ventana del dormitorio', amount: 1, amountLabel: '1 acción' },
  ],
  week: [
    { deviceName: 'Luz del dormitorio', amount: 260, amountLabel: '4 h 20 min' },
    { deviceName: 'Micrófono asistencial', amount: 211, amountLabel: '31 comandos' },
    { deviceName: 'Puerta principal', amount: 128, amountLabel: '12 aperturas' },
    { deviceName: 'Ventana del dormitorio', amount: 75, amountLabel: '8 acciones' },
    { deviceName: 'Luz del pasillo', amount: 105, amountLabel: '1 h 45 min' },
  ],
  month: [
    { deviceName: 'Luz del dormitorio', amount: 1080, amountLabel: '18 h' },
    { deviceName: 'Micrófono asistencial', amount: 860, amountLabel: '126 comandos' },
    { deviceName: 'Puerta principal', amount: 470, amountLabel: '47 aperturas' },
    { deviceName: 'Ventana del dormitorio', amount: 300, amountLabel: '33 acciones' },
    { deviceName: 'Luz del pasillo', amount: 430, amountLabel: '7 h 10 min' },
  ],
};

function bucketsFor(range: MetricRange): AutonomyBucket[] {
  if (range === 'today') {
    return [
      { label: '06–09 h', autonomous: 4, assisted: 1 },
      { label: '09–12 h', autonomous: 5, assisted: 1 },
      { label: '12–15 h', autonomous: 3, assisted: 2 },
      { label: '15–18 h', autonomous: 4, assisted: 0 },
      { label: '18–21 h', autonomous: 5, assisted: 1 },
      { label: '21–24 h', autonomous: 2, assisted: 0 },
    ];
  }
  if (range === 'week') {
    const today = new Date();
    return WEEK.map(([autonomous, assisted], index) => {
      const day = addDays(today, index - 6);
      return { label: day.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''), autonomous, assisted };
    });
  }
  return [
    { label: 'Sem. 1', autonomous: 152, assisted: 41 },
    { label: 'Sem. 2', autonomous: 160, assisted: 35 },
    { label: 'Sem. 3', autonomous: 171, assisted: 29 },
    { label: 'Sem. 4', autonomous: 170, assisted: 27 },
  ];
}

/**
 * shortcut: the analytics contract is pending; the summary repeats the Figma
 * example so the screen can be reviewed. Swap in the HTTP source here.
 */
const localAnalyticsApi: AnalyticsApi = {
  isSample: true,
  getAutonomySummary: (range) =>
    respond({
      range,
      generatedAt: new Date(Date.now() - 4 * 60_000).toISOString(),
      buckets: bucketsFor(range),
      devices: DEVICES[range],
    }),
};

export function getAnalyticsApi(): AnalyticsApi {
  return localAnalyticsApi;
}
