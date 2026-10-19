export class ImageUrl {
  private readonly value: string;

  /**
   * @param value - Absolute or relative URL string.
   */
  constructor(value: string) {
    this.value = value;
  }

  /**
   * @returns The URL string.
   */
  getValue(): string {
    return this.value;
  }
}