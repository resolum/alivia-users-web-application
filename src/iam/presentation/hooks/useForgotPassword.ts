import { useCallback } from 'react';
import { requestPasswordReset } from '../../application/iam.store.ts';
import type { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import type { IamErrorKey } from '../iam-error-keys.ts';
import { useSubmission, type SubmitStatus } from './useSubmission.ts';

export interface UseForgotPasswordResult {
  readonly status: SubmitStatus;
  readonly errorKey: IamErrorKey | null;
  readonly submit: (command: ForgotPasswordCommand) => Promise<boolean>;
}

/** Requests recovery instructions through the store. */
export function useForgotPassword(): UseForgotPasswordResult {
  const { status, errorKey, run } = useSubmission();

  const submit = useCallback(
    (command: ForgotPasswordCommand) =>
      run(() => requestPasswordReset(command)),
    [run],
  );

  return { status, errorKey, submit };
}
