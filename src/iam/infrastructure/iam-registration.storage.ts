/**
 * Progress of the responsible client through sign-up, verification and the
 * household account. It lives in localStorage because the verification link
 * is usually opened in a new tab.
 */
export interface RegistrationProgress {
  /** Email typed in the sign-up form, used to resend the verification link. */
  readonly emailAddress: string;
  readonly maskedEmail: string;
  readonly accountId: string | null;
  readonly emailVerified: boolean;
  readonly householdId: string | null;
}

const REGISTRATION_KEY = 'alivia.iam.registration';

const EMPTY_PROGRESS: RegistrationProgress = {
  emailAddress: '',
  maskedEmail: '',
  accountId: null,
  emailVerified: false,
  householdId: null,
};

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null;
}

function parse(value: unknown): RegistrationProgress | null {
  if (!isRecord(value)) return null;
  return {
    emailAddress: readString(value.emailAddress),
    maskedEmail: readString(value.maskedEmail),
    accountId: readNullableString(value.accountId),
    emailVerified: value.emailVerified === true,
    householdId: readNullableString(value.householdId),
  };
}

/** Reads the stored progress, or null when there is none. */
export function readRegistrationProgress(): RegistrationProgress | null {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_KEY);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    return parse(parsed);
  } catch {
    return null;
  }
}

/** Merges the given fields into the stored progress. */
export function saveRegistrationProgress(
  changes: Partial<RegistrationProgress>,
): RegistrationProgress {
  const next = { ...(readRegistrationProgress() ?? EMPTY_PROGRESS), ...changes };
  try {
    window.localStorage.setItem(REGISTRATION_KEY, JSON.stringify(next));
  } catch {
    console.error('Error writing registration progress');
  }
  return next;
}

/** Starts a new registration, discarding the previous progress. */
export function startRegistrationProgress(
  progress: Pick<RegistrationProgress, 'emailAddress' | 'maskedEmail' | 'accountId'>,
): RegistrationProgress {
  try {
    window.localStorage.removeItem(REGISTRATION_KEY);
  } catch {
    console.error('Error clearing registration progress');
  }
  return saveRegistrationProgress(progress);
}
