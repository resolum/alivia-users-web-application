/** Stages of the family's request: CONFIGURATION until the payment is held, then the tracking stages. */
export type MyContractingStage =
  | 'CONFIGURATION'
  | 'EVALUATION'
  | 'CONFIRMATION'
  | 'INSTALLATION'
  | 'ACTIVATION'
  | 'NOT_VIABLE';

export interface MyContractingProps {
  readonly draftId: string;
  readonly stage: MyContractingStage;
  readonly active: boolean;
  readonly planCode: string;
  readonly billingCycle: string;
}

/** The request of the signed-in family: the caregiver platform opens only once it reached Activación. */
export class MyContracting {
  readonly draftId: string;
  readonly stage: MyContractingStage;
  readonly active: boolean;
  readonly planCode: string;
  readonly billingCycle: string;

  constructor(props: MyContractingProps) {
    this.draftId = props.draftId;
    this.stage = props.stage;
    this.active = props.active;
    this.planCode = props.planCode;
    this.billingCycle = props.billingCycle;
  }

  /** Where the family continues while the platform is closed; null once the service is active. */
  get pendingPath(): string | null {
    // ACTIVATION means the installation was approved and the family may already
    // use the platform, even while the backend finishes marking the service active.
    if (this.active || this.stage === 'ACTIVATION') return null;
    return this.stage === 'CONFIGURATION' ? '/contract/configuration' : '/contract/tracking';
  }
}

/** Where a family without any request starts: choosing the plan. */
export const NO_REQUEST_PATH = '/plans';
