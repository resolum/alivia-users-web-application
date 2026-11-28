import { describe, expect, it } from 'vitest';
import { IamError } from '../../domain/model/iam-error.ts';
import { toAssistedPersonError } from './assisted-person-api-endpoint.ts';

describe('toAssistedPersonError', () => {
  it('marks the document field when the DNI is already registered', () => {
    const error = toAssistedPersonError(409, new IamError({ code: 'unknown', detail: 'DNI 71950690 already exists' }));
    expect(error.code).toBe('validation_failed');
    expect(error.fieldErrors).toEqual({ documentNumber: 'already_registered' });
  });

  it('reports a refused household or staff account as an access problem', () => {
    expect(toAssistedPersonError(403, new IamError({ code: 'unknown' })).code).toBe('role_not_allowed');
  });

  it('keeps any other error as it came', () => {
    const original = new IamError({ code: 'unknown', detail: 'HTTP 500' });
    expect(toAssistedPersonError(500, original)).toBe(original);
  });
});
