export class Address {
  private readonly value: string;

  /**
   * @param value - Primary location description (single line as stored in DB).
   */
  constructor(value: string) {
    this.value = value;
  }

  /**
   * @returns The address string.
   */
  getValue(): string {
    return this.value;
  }
}