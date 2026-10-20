import { useCallback, useState } from 'react';
import {
  toIamErrorKey,
  type IamErrorKey,
} from '../iam-error-keys.ts';

/** Lifecycle of a single authentication form submission. */
export type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface SubmissionResult {
  readonly status: SubmitStatus;
  readonly errorKey: IamErrorKey | null;
  readonly run: (action: () => Promise<void>) => Promise<boolean>;
}

interface SubmissionState {
  readonly status: SubmitStatus;
  readonly errorKey: IamErrorKey | null;
}

const IDLE_STATE: SubmissionState = { status: 'idle', errorKey: null };

/**
 * Shared submission state for the auth forms.
 *
 * It keeps loading and error state local to the view and translates thrown
 * errors into i18n keys, never into user-facing strings.
 */
export function useSubmission(): SubmissionResult {
  const [state, setState] = useState<SubmissionState>(IDLE_STATE);

  const run = useCallback(async (action: () => Promise<void>) => {
    setState({ status: 'submitting', errorKey: null });

    try {
      await action();
      setState({ status: 'success', errorKey: null });
      return true;
    } catch (error) {
      setState({ status: 'error', errorKey: toIamErrorKey(error) });
      return false;
    }
  }, []);

  return { status: state.status, errorKey: state.errorKey, run };
}
