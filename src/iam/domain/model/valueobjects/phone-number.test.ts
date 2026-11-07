import { describe, expect, it } from 'vitest';
import { PhoneNumber } from './phone-number.ts';

describe('PhoneNumber', () => {
  it('keeps only digits and at most 9 of them while typing', () => {
    expect(PhoneNumber.toLocalDigits('98a7 65-4')).toBe('987654');
    expect(PhoneNumber.toLocalDigits('9876543210')).toBe('987654321');
  });

  it('drops the +51 code from a pasted number', () => {
    expect(PhoneNumber.toLocalDigits('+51 987 654 321')).toBe('987654321');
  });

  it('sends a 9-digit mobile starting with 9 as 51 plus the digits', () => {
    expect(PhoneNumber.toE164Digits('987654321')).toBe('51987654321');
    expect(PhoneNumber.check('987654321')).toBeNull();
  });

  it('rejects numbers that are not a Peruvian mobile', () => {
    expect(PhoneNumber.check('')).toBe('required');
    expect(PhoneNumber.check('98765432')).toBe('invalid_phone');
    expect(PhoneNumber.check('187654321')).toBe('invalid_phone');
    expect(PhoneNumber.check('1221991292')).toBe('invalid_phone');
  });
});
