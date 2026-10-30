import type { ProblemType } from './incident.entity.ts';

export type ReportField = 'deviceId' | 'problemType' | 'description' | 'photo';
export type ReportFieldError = 'required' | 'too_short' | 'too_long' | 'invalid_photo';

export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 500;
const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

export interface ReportPhoto {
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly dataUrl: string;
}

export class ReportIncidentCommand {
  readonly deviceId: string;
  readonly problemType: ProblemType | '';
  readonly description: string;
  readonly photo: ReportPhoto | null;

  constructor(deviceId: string, problemType: ProblemType | '', description: string, photo: ReportPhoto | null) {
    this.deviceId = deviceId;
    this.problemType = problemType;
    this.description = description.trim();
    this.photo = photo;
  }

  validate(): Partial<Record<ReportField, ReportFieldError>> {
    const errors: Partial<Record<ReportField, ReportFieldError>> = {};
    if (this.deviceId === '') errors.deviceId = 'required';
    if (this.problemType === '') errors.problemType = 'required';
    if (this.description === '') errors.description = 'required';
    else if (this.description.length < DESCRIPTION_MIN) errors.description = 'too_short';
    else if (this.description.length > DESCRIPTION_MAX) errors.description = 'too_long';
    if (this.photo && (!/^image\/(jpeg|png)$/.test(this.photo.type) || this.photo.size > PHOTO_MAX_BYTES)) {
      errors.photo = 'invalid_photo';
    }
    return errors;
  }
}
