export type ContractingStage = 'EVALUATION' | 'CONFIRMATION' | 'INSTALLATION' | 'ACTIVATION' | 'NOT_VIABLE';
export type EvaluationOutcome = 'VIABLE' | 'VIABLE_WITH_ADAPTATION' | 'NOT_VIABLE';

export interface TechnicalVisitProps {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly technicianName: string;
  readonly directions: string | null;
  readonly status: 'SCHEDULED' | 'COMPLETED';
  readonly result: string | null;
  readonly notes: string | null;
}

export interface ContractingTrackingProps {
  readonly draftId: string;
  readonly code: string;
  readonly stage: ContractingStage;
  readonly planCode: string;
  readonly planName: string;
  readonly rooms: number;
  readonly devices: number;
  readonly monthlyAmount: number | null;
  readonly currency: string;
  readonly evaluation: TechnicalVisitProps | null;
  readonly installation: TechnicalVisitProps | null;
  readonly confirmedAt: string | null;
}

export type StepState = 'done' | 'current' | 'pending';

export interface TrackingStep {
  readonly label: string;
  readonly state: StepState;
  readonly caption: string;
}

const STEP_LABELS = ['Evaluación', 'Confirmación', 'Instalación', 'Activación'] as const;
const STAGE_INDEX: Readonly<Record<ContractingStage, number>> = {
  EVALUATION: 0, CONFIRMATION: 1, INSTALLATION: 2, ACTIVATION: 3, NOT_VIABLE: 0,
};
const CURRENT_CAPTION: Readonly<Record<ContractingStage, string>> = {
  EVALUATION: 'En proceso',
  CONFIRMATION: 'Requiere revisión',
  INSTALLATION: 'En proceso',
  ACTIVATION: 'En proceso',
  NOT_VIABLE: 'No viable',
};

/** Where the family's contracting request stands after the payment, as the backend tracks it. */
export class ContractingTracking {
  readonly draftId: string;
  readonly code: string;
  readonly stage: ContractingStage;
  readonly planCode: string;
  readonly planName: string;
  readonly rooms: number;
  readonly devices: number;
  readonly monthlyAmount: number | null;
  readonly currency: string;
  readonly evaluation: TechnicalVisitProps | null;
  readonly installation: TechnicalVisitProps | null;
  readonly confirmedAt: string | null;

  constructor(props: ContractingTrackingProps) {
    this.draftId = props.draftId;
    this.code = props.code;
    this.stage = props.stage;
    this.planCode = props.planCode;
    this.planName = props.planName;
    this.rooms = props.rooms;
    this.devices = props.devices;
    this.monthlyAmount = props.monthlyAmount;
    this.currency = props.currency;
    this.evaluation = props.evaluation;
    this.installation = props.installation;
    this.confirmedAt = props.confirmedAt;
  }

  /** The four steps of the stepper; a home that is not viable stops at the evaluation. */
  get steps(): readonly TrackingStep[] {
    const current = STAGE_INDEX[this.stage];
    return STEP_LABELS.map((label, index) => {
      if (index < current) return { label, state: 'done', caption: 'Realizada' };
      if (index === current) return { label, state: 'current', caption: CURRENT_CAPTION[this.stage] };
      return { label, state: 'pending', caption: 'Pendiente' };
    });
  }

  get evaluationOutcome(): EvaluationOutcome | null {
    const result = this.evaluation?.status === 'COMPLETED' ? this.evaluation.result : null;
    return result === 'VIABLE' || result === 'VIABLE_WITH_ADAPTATION' || result === 'NOT_VIABLE' ? result : null;
  }

  /** "S/ 179" in soles; other currencies keep their code. */
  get formattedMonthlyAmount(): string | null {
    if (this.monthlyAmount === null) return null;
    const amount = Number.isInteger(this.monthlyAmount) ? String(this.monthlyAmount) : this.monthlyAmount.toFixed(2);
    return this.currency === 'PEN' ? `S/ ${amount}` : `${this.currency} ${amount}`;
  }
}
