export class DateTime {
  private readonly value: string;

  /**
   * @param value - ISO-8601 string (or API-compatible date string).
   */
  constructor(value: string) {
    this.value = value;
  }

  /**
   * @returns The persisted / wire-format string.
   */
  getValue(): string {
    return this.value;
  }
}