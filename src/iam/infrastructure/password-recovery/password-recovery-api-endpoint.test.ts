import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChangePasswordCommand } from '../../domain/model/change-password.command.ts';
import { ForgotPasswordCommand } from '../../domain/model/forgot-password.command.ts';
import { ResetPasswordCommand } from '../../domain/model/reset-password.command.ts';
import { PasswordRecoveryApiEndpoint } from './password-recovery-api-endpoint.ts';

function reply(status: number, body?: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(body === undefined ? null : JSON.stringify(body), { status }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const sentBody = (fetchMock: ReturnType<typeof vi.fn>) =>
  JSON.parse(String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body)) as unknown;

const endpoint = new PasswordRecoveryApiEndpoint();
const reset = new ResetPasswordCommand({
  emailAddress: ' maria@example.com ',
  code: '482915',
  newPassword: 'Segura#2026',
});

afterEach(() => vi.unstubAllGlobals());

describe('PasswordRecoveryApiEndpoint', () => {
  it('sends the backend field names for forgot and reset', async () => {
    let fetchMock = reply(202);
    await endpoint.requestPasswordReset(new ForgotPasswordCommand({ emailAddress: 'maria@example.com' }));
    expect(sentBody(fetchMock)).toEqual({ email: 'maria@example.com' });

    fetchMock = reply(204);
    await endpoint.resetPassword(reset);
    expect(sentBody(fetchMock)).toEqual({ email: 'maria@example.com', code: '482915', password: 'Segura#2026' });
  });

  it('names a rejected or expired reset code as a password code error', async () => {
    reply(400, { code: 'verification_token_invalid' });
    await expect(endpoint.resetPassword(reset)).rejects.toMatchObject({ code: 'invalid_password_token' });

    reply(400, { code: 'verification_token_expired' });
    await expect(endpoint.resetPassword(reset)).rejects.toMatchObject({ code: 'password_token_expired' });
  });

  it('reports a wrong current password apart from other change errors', async () => {
    const change = new ChangePasswordCommand({ currentPassword: 'Vieja#2025', newPassword: 'Segura#2026' });
    const fetchMock = reply(400, { code: 'validation_failed', errors: [{ field: 'currentPassword', code: 'incorrect' }] });
    await expect(endpoint.changePassword(change)).rejects.toMatchObject({ code: 'current_password_incorrect' });
    expect((fetchMock.mock.calls[0] as [string, RequestInit])[1].method).toBe('PATCH');

    reply(400, { code: 'validation_failed', errors: [{ field: 'newPassword', code: 'password_weak' }] });
    await expect(endpoint.changePassword(change)).rejects.toMatchObject({ code: 'validation_failed' });
  });
});

describe('ResetPasswordCommand', () => {
  it('requires a 6-digit code', () => {
    const withCode = (code: string) =>
      new ResetPasswordCommand({ emailAddress: 'maria@example.com', code, newPassword: 'Segura#2026' }).validate();
    expect(withCode('')).toEqual({ code: 'required' });
    expect(withCode('12345')).toEqual({ code: 'invalid' });
    expect(withCode('482915')).toEqual({});
  });
});
