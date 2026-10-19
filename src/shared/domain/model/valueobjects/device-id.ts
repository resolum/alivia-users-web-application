/**
 * Value object representing the unique identifier of an IoT device.
 */
export class DeviceId {
  readonly value: string;

  private constructor(value: string) {
    this.validate(value);
    this.value = value;
  }

  static create(value: string): DeviceId {
    return new DeviceId(value);
  }

  static empty(): DeviceId {
    return new DeviceId('');
  }

  equals(other: DeviceId): boolean {
    return this.value === other.value;
  }

  private validate(value: string): void {
    if (value === null || value === undefined) {
      throw new Error('DeviceId cannot be null or undefined');
    }
  }
}