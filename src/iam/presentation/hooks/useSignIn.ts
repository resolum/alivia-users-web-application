import { useCallback } from 'react';
import { signIn } from '../../application/iam.store.ts';
import type { SignInCommand } from '../../domain/model/sign-in.command.ts';
import type { IamErrorKey } from '../iam-error-keys.ts';
import { useSubmission, type SubmitStatus } from './useSubmission.ts';

export interface UseSignInResult {
  readonly status: SubmitStatus;
  readonly errorKey: IamErrorKey | null;
  readonly submit: (
    command: SignInCommand,
    remember: boolean,
  ) => Promise<boolean>;
}

/** Signs in through the IAM store and exposes the local submission state. */
export function useSignIn(): UseSignInResult {
  const { status, errorKey, run } = useSubmission();

  const submit = useCallback(
    (command: SignInCommand, remember: boolean) =>
      run(() => signIn(command, remember)),
    [run],
  );

  return { status, errorKey, submit };
}
