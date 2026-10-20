import { useCallback } from 'react';
import { resetPassword } from '../../application/iam.store.ts';
import type { DefinePasswordCommand } from '../../domain/model/reset-password.command.ts';
import type { IamErrorKey } from '../iam-error-keys.ts';
import { useSubmission, type SubmitStatus } from './useSubmission.ts';

export interface UseResetPasswordResult {
  readonly status: SubmitStatus;
  readonly errorKey: IamErrorKey | null;
  readonly submit: (command: DefinePasswordCommand) => Promise<boolean>;
}

/** Sets a new password through the store. */
export function useResetPassword(): UseResetPasswordResult {
  const { status, errorKey, run } = useSubmission();

  const submit = useCallback(
    (command: DefinePasswordCommand) => run(() => resetPassword(command)),
    [run],
  );

  return { status, errorKey, submit };
}
