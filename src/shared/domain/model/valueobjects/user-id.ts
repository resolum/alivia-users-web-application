/**
 * Shared value object: identifier of a user account (string-backed).
 */
export class UserId {
  private readonly value: string;

  /**
   * @param value - Stable user id from the identity / accounts context.
   */
  constructor(value: string) {
    this.value = value;
  }

  /**
   * @returns The raw string id.
   */
  getValue(): string {
    return this.value;
  }
}