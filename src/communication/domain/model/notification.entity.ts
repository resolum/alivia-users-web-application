export type NotificationKind =
  | 'assistance_request'
  | 'low_battery'
  | 'upcoming_activity'
  | 'incident_update'
  | 'handover_escalated'
  | 'medication_overdue';

/** Notice delivered to a caregiver. Backend equivalent: Notification (Comunicaciones, pending contract). */
export interface CaregiverNotification {
  readonly id: string;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly read: boolean;
  /** In-app destination of the call to action. */
  readonly route: string;
  readonly actionLabel: string;
}

/** Urgent notices get a filled button; the rest a text link. */
export const isUrgent = (notification: CaregiverNotification) =>
  notification.kind === 'assistance_request' || notification.kind === 'handover_escalated';

export function isToday(notification: CaregiverNotification, now: Date = new Date()): boolean {
  return new Date(notification.createdAt).toDateString() === now.toDateString();
}
