import { useState, type FormEvent } from 'react';
import { IdCard, Lock, Phone, Save, UserPen } from 'lucide-react';
import { inputBase } from '@/shared/presentation/components/base-form/Inputs.tsx';
import { Button, Card } from '@/shared/presentation/components/ui/index.ts';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';
import { updateProfile } from '../../application/profiles.store.ts';
import type { PersonProfile } from '../../domain/model/person-profile.entity.ts';
import { ProfileError, type ProfileErrorCode, type ProfileFieldErrors } from '../../domain/model/profile-error.ts';
import { UpdateProfileCommand, type UpdateProfileField } from '../../domain/model/update-profile.command.ts';
import { formatPhone } from '../profile-format.ts';
import { describedBy } from '../field-described-by.ts';
import { ProfileField } from './ProfileField.tsx';

interface PersonalDataFormProps {
  readonly profile: PersonProfile;
  readonly onSaved: (profile: PersonProfile) => void;
}

type FormValues = Readonly<Record<UpdateProfileField, string>>;

const FIELD_ORDER: readonly UpdateProfileField[] = ['firstName', 'lastName', 'phoneNumber'];
const ID = 'profile';

function toValues(profile: PersonProfile): FormValues {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phoneNumber: formatPhone(profile.phoneNumber),
  };
}

const editableInput = `${inputBase} min-h-11 aria-invalid:border-alivia-danger aria-invalid:bg-white`;
const readOnlyInput = `${inputBase} min-h-11 cursor-default text-alivia-text-muted hover:border-transparent focus:bg-alivia-primary-mist/60`;

export function PersonalDataForm({ profile, onSaved }: PersonalDataFormProps) {
  const t = useTranslations().profiles;
  const initial = toValues(profile);
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<ProfileFieldErrors<UpdateProfileField>>({});
  const [apiError, setApiError] = useState<ProfileErrorCode | null>(null);
  const [saving, setSaving] = useState(false);

  const isDirty = FIELD_ORDER.some((field) => values[field] !== initial[field]);

  const setField = (field: UpdateProfileField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const reset = () => {
    setValues(initial);
    setErrors({});
    setApiError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const command = new UpdateProfileCommand(values);
    const fieldErrors = command.validate();
    setErrors(fieldErrors);
    setApiError(null);
    const firstInvalid = FIELD_ORDER.find((field) => fieldErrors[field]);
    if (firstInvalid) {
      document.getElementById(`${ID}-${firstInvalid}`)?.focus();
      return;
    }

    setSaving(true);
    try {
      const updated = await updateProfile(profile, command);
      setValues(toValues(updated));
      onSaved(updated);
    } catch (error) {
      setApiError(error instanceof ProfileError ? error.code : 'unknown');
    } finally {
      setSaving(false);
    }
  };

  const fieldError = (field: UpdateProfileField) => {
    const code = errors[field];
    return code ? t.fieldErrors[code] : undefined;
  };

  const textField = (field: UpdateProfileField, label: string, hint: string, autoComplete: string) => {
    const id = `${ID}-${field}`;
    const error = fieldError(field);
    return (
      <ProfileField id={id} label={label} required hint={hint} error={error}>
        <input
          id={id}
          value={values[field]}
          onChange={(event) => setField(field, event.target.value)}
          autoComplete={autoComplete}
          required
          aria-invalid={error !== undefined}
          aria-describedby={describedBy(id, error, hint)}
          className={editableInput}
        />
      </ProfileField>
    );
  };

  const phoneId = `${ID}-phoneNumber`;
  const phoneError = fieldError('phoneNumber');

  return (
    <Card className="overflow-hidden">
      <form noValidate onSubmit={handleSubmit}>
        <div className="flex items-center justify-between gap-3 border-b border-alivia-primary-mist bg-alivia-primary-mist/45 px-5 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-alivia-primary">
            <UserPen className="size-5" aria-hidden="true" />
            {t.form.sectionTitle}
          </h2>
          <p className="text-xs font-semibold text-alivia-text-muted">
            <span aria-hidden="true" className="text-alivia-danger">* </span>
            {t.form.requiredLegend}
          </p>
        </div>

        <div className="grid gap-x-6 gap-y-5 px-5 py-6 sm:px-6 md:grid-cols-2">
          {textField('firstName', t.form.firstName, t.form.firstNameHint, 'given-name')}
          {textField('lastName', t.form.lastName, t.form.lastNameHint, 'family-name')}

          <ProfileField id={`${ID}-dni`} label={t.form.dni} hint={t.form.dniHint}>
            <div className="relative">
              <input
                id={`${ID}-dni`}
                readOnly
                value={profile.dni}
                aria-describedby={`${ID}-dni-hint`}
                className={`${readOnlyInput} pr-10 tabular-nums`}
              />
              <IdCard className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-alivia-secondary-dark" aria-hidden="true" />
            </div>
          </ProfileField>

          <ProfileField id={phoneId} label={t.form.phoneNumber} required hint={t.form.phoneHint} error={phoneError}>
            <div className="relative">
              <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-alivia-text-muted" aria-hidden="true" />
              <input
                id={phoneId}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={values.phoneNumber}
                onChange={(event) => setField('phoneNumber', event.target.value)}
                aria-invalid={phoneError !== undefined}
                aria-describedby={describedBy(phoneId, phoneError, t.form.phoneHint)}
                className={`${editableInput} pl-9 tabular-nums`}
              />
            </div>
          </ProfileField>

          <div className="md:col-span-2">
            <ProfileField
              id={`${ID}-email`}
              label={
                <>
                  <Lock className="size-3.5 text-alivia-text-muted" aria-hidden="true" />
                  {t.form.email}
                </>
              }
              hint={t.form.emailHint}
              aside={
                <span className="shrink-0 rounded-full bg-alivia-mint px-2.5 py-0.5 text-[11px] font-semibold text-alivia-secondary-deep">
                  {t.form.emailLocked}
                </span>
              }
            >
              <input
                id={`${ID}-email`}
                type="email"
                readOnly
                value={profile.emailAddress}
                aria-describedby={`${ID}-email-hint`}
                className={readOnlyInput}
              />
            </ProfileField>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-alivia-primary-mist px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          {apiError && (
            <p role="alert" className="animate-notice-in text-sm font-medium text-alivia-danger sm:mr-auto">
              {t.errors[apiError]}
            </p>
          )}
          {isDirty && !apiError && (
            <p role="status" className="flex items-center gap-2 text-xs font-semibold text-alivia-secondary-deep sm:mr-auto">
              <span aria-hidden="true" className="size-2 rounded-full bg-alivia-secondary" />
              {t.unsavedChanges}
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="ghost" onClick={reset} disabled={!isDirty || saving} className="min-h-11">
              {t.form.cancel}
            </Button>
            <Button type="submit" loading={saving} disabled={!isDirty || saving} className="min-h-11">
              {!saving && <Save className="size-4" aria-hidden="true" />}
              {t.form.save}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
