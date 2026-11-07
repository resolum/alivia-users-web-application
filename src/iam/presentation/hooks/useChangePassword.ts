import { useCallback } from 'react';
import { changePassword } from '../../application/iam.store.ts';
import type { ChangePasswordCommand } from '../../domain/model/change-password.command.ts';
import type { IamErrorKey } from '../iam-error-keys.ts';
import { useSubmission, type SubmitStatus } from './useSubmission.ts';

export interface UseChangePasswordResult {
  readonly status: SubmitStatus;
  readonly errorKey: IamErrorKey | null;
  readonly submit: (command: ChangePasswordCommand) => Promise<boolean>;
}

/** Changes the password of the signed-in user through the store. */
export function useChangePassword(): UseChangePasswordResult {
  const { status, errorKey, run } = useSubmission();

  const submit = useCallback(
    (command: ChangePasswordCommand) => run(() => changePassword(command)),
    [run],
  );

  return { status, errorKey, submit };
}
