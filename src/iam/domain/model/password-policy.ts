const MIN_LENGTH = 8;
const SPECIAL_CHARACTERS = '@$!%*?&#';

/** Identifier of each password requirement shown in the UI. */
export type PasswordRequirementId =
  | 'length'
  | 'uppercase'
  | 'lowercase'
  | 'digit'
  | 'special';

/** Result of evaluating one password requirement. */
export interface PasswordRequirement {
  readonly id: PasswordRequirementId;
  readonly satisfied: boolean;
}

function containsUppercase(value: string): boolean {
  for (const character of value) {
    if (character >= 'A' && character <= 'Z') return true;
  }
  return false;
}

function containsLowercase(value: string): boolean {
  for (const character of value) {
    if (character >= 'a' && character <= 'z') return true;
  }
  return false;
}

function containsDigit(value: string): boolean {
  for (const character of value) {
    if (character >= '0' && character <= '9') return true;
  }
  return false;
}

function containsSpecial(value: string): boolean {
  for (const character of value) {
    if (SPECIAL_CHARACTERS.includes(character)) return true;
  }
  return false;
}

export function evaluatePassword(
  password: string,
): readonly PasswordRequirement[] {
  return [
    { id: 'length', satisfied: password.length >= MIN_LENGTH },
    { id: 'uppercase', satisfied: containsUppercase(password) },
    { id: 'lowercase', satisfied: containsLowercase(password) },
    { id: 'digit', satisfied: containsDigit(password) },
    { id: 'special', satisfied: containsSpecial(password) },
  ];
}

/** True when every password requirement is satisfied. */
export function isStrongPassword(password: string): boolean {
  return evaluatePassword(password).every(
    (requirement) => requirement.satisfied,
  );
}

/** True when both passwords are non-empty and equal. */
export function passwordsMatch(
  password: string,
  confirmation: string,
): boolean {
  return password.length > 0 && password === confirmation;
}
