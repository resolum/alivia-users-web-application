import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Accessibility, ArrowLeft, Check, PhoneCall, ShieldCheck } from 'lucide-react';
import { Checkbox } from '@/shared/presentation/components/base-form/index.ts';
import { inputBase } from '@/shared/presentation/components/base-form/Inputs.tsx';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { getRegistrationProgress, registerAssistedPerson } from '../../application/iam.store.ts';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import { IamError } from '../../domain/model/iam-error.ts';
import {
  ASSISTED_DOCUMENT_TYPES,
  KINSHIPS,
  MOBILITY_LEVELS,
  RegisterAssistedPersonCommand,
  type AssistedDocumentType,
  type AssistedPersonRegistrationField,
  type AssistedPersonRegistrationValues,
  type Kinship,
} from '../../domain/model/register-assisted-person.command.ts';
import { AuthErrorAlert } from '../components/AuthErrorAlert.tsx';
import { AuthField } from '../components/AuthField.tsx';
import { AuthFormHeader } from '../components/AuthFormHeader.tsx';
import { AuthLinkButton } from '../components/AuthLinkButton.tsx';
import { AuthSubmitButton } from '../components/AuthSubmitButton.tsx';
import { HouseholdSubsteps } from '../components/HouseholdSubsteps.tsx';
import { PeruMobileField } from '../components/PeruMobileField.tsx';
import { RegistrationLayout } from '../components/RegistrationLayout.tsx';
import { RegistrationTextField } from '../components/RegistrationTextField.tsx';
import { fieldErrorMessage, focusFirstInvalid } from '../field-error-message.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { useSubmission } from '../hooks/useSubmission.ts';

const ID_PREFIX = 'assisted-person';

/** Order in which the form shows the fields, used to focus the first error. */
const FIELD_ORDER: readonly AssistedPersonRegistrationField[] = [
  'firstName',
  'lastName',
  'birthDate',
  'documentNumber',
  'kinship',
  'phoneNumber',
  'mobilityLevel',
  'emergencyContactName',
  'emergencyContactPhone',
  'consent',
];

const EMPTY_VALUES: AssistedPersonRegistrationValues = {
  firstName: '',
  lastName: '',
  birthDate: '',
  documentType: 'DNI',
  documentNumber: '',
  kinship: '',
  phoneNumber: '',
  mobilityLevel: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  consent: false,
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface ChoiceCardsProps<T extends string> {
  readonly id: string;
  readonly legend: string;
  readonly options: readonly T[];
  readonly labels: Readonly<Record<T, string>>;
  readonly value: T | '';
  readonly onChange: (value: T) => void;
  readonly error?: string;
}

/** Single choice shown as selectable cards; the first card takes the focus on error. */
function ChoiceCards<T extends string>({ id, legend, options, labels, value, onChange, error }: ChoiceCardsProps<T>) {
  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined} className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-semibold text-alivia-text">
        {legend}
        <span aria-hidden="true" className="ml-0.5 text-alivia-danger">*</span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option, index) => {
          const selected = value === option;
          return (
            <label
              key={option}
              className={[
                'flex min-h-14 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-alivia-primary',
                selected
                  ? 'border-alivia-primary bg-alivia-primary-mist text-alivia-primary-dark'
                  : 'border-slate-200 bg-white text-alivia-text hover:border-alivia-primary-light',
              ].join(' ')}
            >
              <input
                id={index === 0 ? id : undefined}
                type="radio"
                name={id}
                value={option}
                checked={selected}
                aria-invalid={error !== undefined}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={[
                  'grid size-5 shrink-0 place-items-center rounded-full border',
                  selected ? 'border-alivia-primary bg-alivia-primary text-white' : 'border-slate-300',
                ].join(' ')}
              >
                {selected && <Check className="size-3.5" />}
              </span>
              {labels[option]}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-alivia-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function SectionTitle({ icon, children }: { readonly icon?: React.ReactNode; readonly children: React.ReactNode }) {
  return (
    <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-alivia-primary">
      {icon}
      {children}
    </legend>
  );
}

/**
 * Second substep of the household step: who will use Alivia, with the quick
 * accessibility profile and an optional secondary emergency contact.
 */
export function AssistedPersonRegistrationView() {
  const t = useIamTranslations();
  const copy = t.assistedPerson;
  useDocumentTitle(copy.title);
  const navigate = useNavigate();
  const { status, errorKey, run } = useSubmission();
  const [values, setValues] = useState<AssistedPersonRegistrationValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors<AssistedPersonRegistrationField>>({});
  const [showPending, setShowPending] = useState(false);

  if (!getRegistrationProgress()?.householdId) {
    return (
      <RegistrationLayout step={3}>
        <div className="space-y-6">
          <AuthFormHeader title={copy.noHouseholdTitle} subtitle={copy.noHouseholdBody} />
          <AuthLinkButton to="/household/new" label={copy.goToHousehold} />
        </div>
      </RegistrationLayout>
    );
  }

  const labels: Readonly<Record<AssistedPersonRegistrationField, string>> = {
    firstName: copy.firstNameLabel,
    lastName: copy.lastNameLabel,
    birthDate: copy.birthDateLabel,
    documentNumber: copy.documentNumberLabel,
    kinship: copy.kinshipLabel,
    phoneNumber: copy.phoneLabel,
    mobilityLevel: copy.mobilityLabel,
    emergencyContactName: copy.emergencyNameLabel,
    emergencyContactPhone: copy.emergencyPhoneLabel,
    consent: copy.consentRequired,
  };
  const pendingFields = FIELD_ORDER.filter((field) => errors[field] !== undefined);

  function change<K extends keyof AssistedPersonRegistrationValues>(
    field: K,
    value: AssistedPersonRegistrationValues[K],
  ): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current, [field]: undefined };
      // The two parts of the emergency contact are checked together.
      if (field === 'emergencyContactName' || field === 'emergencyContactPhone') {
        next.emergencyContactName = undefined;
        next.emergencyContactPhone = undefined;
      }
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const command = new RegisterAssistedPersonCommand(values);
    const nextErrors = command.validate();
    setErrors(nextErrors);
    setShowPending(Object.keys(nextErrors).length > 0);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(FIELD_ORDER, nextErrors, ID_PREFIX);
      return;
    }

    void run(async () => {
      try {
        await registerAssistedPerson(command);
      } catch (error) {
        if (error instanceof IamError) {
          setErrors((current) => ({ ...current, ...error.fieldErrors }));
        }
        throw error;
      }
    }).then((successful) => {
      if (successful) void navigate('/contract/configuration');
    });
  }

  const message = (field: AssistedPersonRegistrationField) => fieldErrorMessage(t, errors[field]);
  const text = (field: 'firstName' | 'lastName' | 'emergencyContactName') => ({
    id: `${ID_PREFIX}-${field}`,
    label: labels[field],
    value: values[field],
    onValueChange: (value: string) => change(field, value),
    error: message(field),
  });

  return (
    <RegistrationLayout step={3}>
      <div className="space-y-6">
        <HouseholdSubsteps current={2} />
        <AuthFormHeader title={copy.title} subtitle={copy.subtitle} />

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-7">
          {showPending && pendingFields.length > 0 && (
            <div role="alert" className="rounded-xl bg-alivia-danger/10 px-4 py-3 text-sm">
              <p className="font-semibold text-alivia-danger">{copy.pendingTitle}</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {pendingFields.map((name) => (
                  <li key={name}>
                    <a
                      href={`#${ID_PREFIX}-${name}`}
                      onClick={(event) => {
                        event.preventDefault();
                        document.getElementById(`${ID_PREFIX}-${name}`)?.focus();
                      }}
                      className="inline-flex min-h-9 items-center rounded-lg bg-white px-3 font-semibold text-alivia-primary underline-offset-4 hover:underline"
                    >
                      {labels[name]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {errorKey && errorKey !== 'validationFailed' && <AuthErrorAlert message={t.errors[errorKey]} />}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <SectionTitle>{copy.personalSection}</SectionTitle>
            <RegistrationTextField {...text('firstName')} autoComplete="off" maxLength={75} />
            <RegistrationTextField {...text('lastName')} autoComplete="off" maxLength={75} />
            <RegistrationTextField
              id={`${ID_PREFIX}-birthDate`}
              label={labels.birthDate}
              type="date"
              min="1900-01-01"
              max={todayIso()}
              value={values.birthDate}
              onValueChange={(value) => change('birthDate', value)}
              error={message('birthDate')}
            />
            <AuthField
              id={`${ID_PREFIX}-kinship`}
              label={labels.kinship}
              required
              requiredLabel={t.common.required}
              error={message('kinship')}
            >
              <select
                id={`${ID_PREFIX}-kinship`}
                required
                value={values.kinship}
                aria-invalid={errors.kinship !== undefined}
                aria-describedby={errors.kinship ? `${ID_PREFIX}-kinship-error` : undefined}
                onChange={(event) => change('kinship', event.target.value as Kinship)}
                className={[inputBase, 'min-h-12'].join(' ')}
              >
                <option value="" disabled>
                  {copy.kinshipPlaceholder}
                </option>
                {KINSHIPS.map((kinship) => (
                  <option key={kinship} value={kinship}>
                    {copy.kinships[kinship]}
                  </option>
                ))}
              </select>
            </AuthField>
            <div className="sm:col-span-2">
              <PeruMobileField
                id={`${ID_PREFIX}-phoneNumber`}
                label={labels.phoneNumber}
                optional
                value={values.phoneNumber}
                onValueChange={(value) => change('phoneNumber', value)}
                error={message('phoneNumber')}
              />
            </div>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_1fr]">
            <SectionTitle>{copy.documentSection}</SectionTitle>
            <AuthField id={`${ID_PREFIX}-documentType`} label={copy.documentTypeLabel} requiredLabel={t.common.required}>
              <select
                id={`${ID_PREFIX}-documentType`}
                value={values.documentType}
                onChange={(event) => change('documentType', event.target.value as AssistedDocumentType)}
                className={[inputBase, 'min-h-12'].join(' ')}
              >
                {ASSISTED_DOCUMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {copy.documentTypes[type]}
                  </option>
                ))}
              </select>
            </AuthField>
            <RegistrationTextField
              id={`${ID_PREFIX}-documentNumber`}
              label={labels.documentNumber}
              optional
              inputMode={values.documentType === 'DNI' ? 'numeric' : 'text'}
              autoComplete="off"
              maxLength={values.documentType === 'DNI' ? 8 : 12}
              value={values.documentNumber}
              onValueChange={(value) => change('documentNumber', value)}
              error={message('documentNumber')}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-2xl border border-alivia-primary-mist bg-[#f7f7fc] p-4 sm:p-5">
            <SectionTitle icon={<Accessibility aria-hidden="true" className="size-5" />}>
              {copy.accessibilitySection}
            </SectionTitle>
            <p className="-mt-2 text-xs text-alivia-text-muted">{copy.accessibilityHint}</p>
            <ChoiceCards
              id={`${ID_PREFIX}-mobilityLevel`}
              legend={labels.mobilityLevel}
              options={MOBILITY_LEVELS}
              labels={copy.mobilityLevels}
              value={values.mobilityLevel}
              onChange={(value) => change('mobilityLevel', value)}
              error={errors.mobilityLevel ? copy.selectionRequired : undefined}
            />
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <SectionTitle icon={<PhoneCall aria-hidden="true" className="size-5" />}>
              {copy.emergencySection}
            </SectionTitle>
            <RegistrationTextField {...text('emergencyContactName')} optional autoComplete="off" maxLength={120} />
            <PeruMobileField
              id={`${ID_PREFIX}-emergencyContactPhone`}
              label={labels.emergencyContactPhone}
              optional
              value={values.emergencyContactPhone}
              onValueChange={(value) => change('emergencyContactPhone', value)}
              error={message('emergencyContactPhone')}
            />
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Checkbox
              id={`${ID_PREFIX}-consent`}
              label={copy.consent}
              checked={values.consent}
              aria-invalid={errors.consent !== undefined}
              aria-describedby={errors.consent ? `${ID_PREFIX}-consent-error` : undefined}
              onChange={(event) => change('consent', event.target.checked)}
            />
            {errors.consent && (
              <p id={`${ID_PREFIX}-consent-error`} role="alert" className="text-xs font-medium text-alivia-danger">
                {copy.consentRequired}
              </p>
            )}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/household/new"
              className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-bold text-alivia-primary hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {copy.back}
            </Link>
            <div className="sm:min-w-64">
              <AuthSubmitButton label={copy.submit} loading={status === 'submitting'} />
            </div>
          </div>

          <details className="rounded-xl bg-alivia-primary-mist/50 px-4 py-3 text-sm">
            <summary className="flex min-h-9 cursor-pointer items-center gap-2 font-semibold text-alivia-primary">
              <ShieldCheck aria-hidden="true" className="size-4" />
              {copy.privacyTitle}
            </summary>
            <p className="mt-2 text-alivia-text-muted">{copy.privacyBody}</p>
          </details>
        </form>
      </div>
    </RegistrationLayout>
  );
}
