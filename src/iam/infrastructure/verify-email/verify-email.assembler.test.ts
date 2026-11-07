import { describe, expect, it } from 'vitest';
import { VerifyEmailCommand } from '../../domain/model/verify-email.command.ts';
import { VerifyEmailAssembler } from './verify-email.assembler.ts';

describe('VerifyEmailCommand', () => {
  it('sends the backend field names with a normalized email', () => {
    const command = new VerifyEmailCommand({ emailAddress: ' Maria@Example.com ', code: '482915' });
    expect(command.validate()).toEqual({});
    expect(VerifyEmailAssembler.toRequestFromCommand(command)).toEqual({ email: 'maria@example.com', code: '482915' });
  });

  it('requires an email and a 6-digit code', () => {
    expect(new VerifyEmailCommand({ emailAddress: '', code: '' }).validate()).toEqual({ emailAddress: 'required', code: 'required' });
    expect(new VerifyEmailCommand({ emailAddress: 'maria@example.com', code: '4829' }).validate()).toEqual({ code: 'invalid' });
  });
});
