import { describe, expect, it } from 'vitest';
import { AssistedPerson } from './assisted-person.entity.ts';
import { UpdateAssistedPersonCommand } from './update-assisted-person.command.ts';

const person = new AssistedPerson({
  id: 'ap', firstName: 'Alberto', lastName: 'Villanueva Carrión', documentType: 'DNI', documentNumber: '08472910',
  documentValidated: true, birthDate: '1942-05-14', kinship: 'Padre', phone: null, photoUrl: null,
  householdAlias: 'Hogar', principalCaregiverName: 'María', principalCaregiverKinship: 'Hija',
});

describe('AssistedPerson', () => {
  it('counts the age only once the birthday has passed', () => {
    expect(person.ageAt(new Date('2026-05-13T12:00:00'))).toBe(83);
    expect(person.ageAt(new Date('2026-05-14T12:00:00'))).toBe(84);
  });

  it('is incomplete without a contact phone', () => {
    expect(person.isComplete).toBe(false);
  });
});

describe('UpdateAssistedPersonCommand', () => {
  const now = new Date('2026-10-29T12:00:00');

  it('accepts an empty phone and formats a valid one', () => {
    const base = { firstName: 'Alberto', lastName: 'Villanueva', birthDate: '1942-05-14', kinship: 'Padre' };
    expect(new UpdateAssistedPersonCommand({ ...base, localPhone: '' }).phone).toBeNull();
    const command = new UpdateAssistedPersonCommand({ ...base, localPhone: '912 345 678' });
    expect(command.validate(now)).toEqual({});
    expect(command.phone).toBe('+51 912 345 678');
  });

  it('rejects future birth dates and short names', () => {
    const errors = new UpdateAssistedPersonCommand({
      firstName: 'A', lastName: 'Villanueva', birthDate: '2027-01-01', kinship: '', localPhone: '123',
    }).validate(now);
    expect(errors).toEqual({ firstName: 'too_short', birthDate: 'invalid_date', kinship: 'required', phone: 'invalid_phone' });
  });
});
