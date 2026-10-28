import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { CheckCircle2 } from 'lucide-react';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import {
  createHouseholdAccount,
  getRegistrationProgress,
} from '../../application/iam.store.ts';
import {
  CreateHouseholdAccountCommand,
  type HouseholdField,
} from '../../domain/model/create-household-account.command.ts';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import { IamError } from '../../domain/model/iam-error.ts';
import { AuthErrorAlert } from '../components/AuthErrorAlert.tsx';
import { AuthFormHeader } from '../components/AuthFormHeader.tsx';
import { AuthLinkButton } from '../components/AuthLinkButton.tsx';
import { AuthSubmitButton } from '../components/AuthSubmitButton.tsx';
import { RegistrationLayout } from '../components/RegistrationLayout.tsx';
import { RegistrationTextField } from '../components/RegistrationTextField.tsx';
import { fieldErrorMessage, focusFirstInvalid } from '../field-error-message.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { useSubmission } from '../hooks/useSubmission.ts';

const ID_PREFIX = 'household';

/** Order in which the form shows the household fields. */
const HOUSEHOLD_FIELDS: readonly HouseholdField[] = [
  'alias',
  'phoneNumber',
  'contactEmail',
  'address',
  'district',
  'city',
];

type HouseholdValues = Readonly<Record<HouseholdField, string>>;

function cameFromVerification(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'emailVerified' in state;
}

function NotVerifiedNotice({ hasPendingSignUp }: { readonly hasPendingSignUp: boolean }) {
  const t = useIamTranslations();
  return (
    <div className="space-y-6">
      <AuthFormHeader title={t.household.notVerifiedTitle} subtitle={t.household.notVerifiedBody} />
      {hasPendingSignUp ? (
        <AuthLinkButton to="/sign-up/email-sent" label={t.household.goToEmailSent} />
      ) : (
        <AuthLinkButton to="/sign-up" label={t.household.startSignUp} />
      )}
    </div>
  );
}

export function HouseholdAccountView() {
  const t = useIamTranslations();
  useDocumentTitle(t.household.title);
  const location = useLocation();
  const navigate = useNavigate();
  const { status, errorKey, run } = useSubmission();
  const [progress] = useState(getRegistrationProgress);
  const [values, setValues] = useState<HouseholdValues>({
    alias: '',
    phoneNumber: '',
    contactEmail: progress?.emailAddress ?? '',
    address: '',
    district: '',
    city: '',
  });
  const [errors, setErrors] = useState<FieldErrors<HouseholdField>>({});
  const [showPending, setShowPending] = useState(false);

  const accountId = progress?.accountId ?? null;
  if (progress?.emailVerified !== true || accountId === null) {
    return (
      <RegistrationLayout step={3}>
        <NotVerifiedNotice hasPendingSignUp={progress !== null} />
      </RegistrationLayout>
    );
  }

  const labels: Readonly<Record<HouseholdField, string>> = {
    alias: t.household.aliasLabel,
    phoneNumber: t.household.phoneLabel,
    contactEmail: t.household.contactEmailLabel,
    address: t.household.addressLabel,
    district: t.household.districtLabel,
    city: t.household.cityLabel,
  };
  const pendingFields = HOUSEHOLD_FIELDS.filter((field) => errors[field] !== undefined);

  function change(field: HouseholdField, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const command = new CreateHouseholdAccountCommand({
      ...values,
      responsibleAccountId: accountId ?? '',
    });
    const nextErrors = command.validate();
    setErrors(nextErrors);
    setShowPending(Object.keys(nextErrors).length > 0);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(HOUSEHOLD_FIELDS, nextErrors, ID_PREFIX);
      return;
    }

    void run(async () => {
      try {
        await createHouseholdAccount(command);
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

  const field = (name: HouseholdField) => ({
    id: `${ID_PREFIX}-${name}`,
    label: labels[name],
    value: values[name],
    onValueChange: (value: string) => change(name, value),
    error: fieldErrorMessage(t, errors[name]),
  });

  return (
    <RegistrationLayout step={3}>
      <div className="space-y-6">
        {cameFromVerification(location.state) && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-alivia-mint px-4 py-3 text-sm font-semibold text-alivia-secondary-deep">
            <CheckCircle2 aria-hidden="true" className="size-5 shrink-0" />
            {t.household.verifiedBanner}
          </p>
        )}
        <AuthFormHeader title={t.household.title} subtitle={t.household.subtitle} />

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
          {showPending && pendingFields.length > 0 && (
            <div role="alert" className="rounded-xl bg-alivia-danger/10 px-4 py-3 text-sm">
              <p className="font-semibold text-alivia-danger">{t.household.pendingTitle}</p>
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
          {errorKey && errorKey !== 'validationFailed' && (
            <AuthErrorAlert message={t.errors[errorKey]} />
          )}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-bold text-alivia-primary">
              {t.household.contactSection}
            </legend>
            <div className="sm:col-span-2">
              <RegistrationTextField
                {...field('alias')}
                autoComplete="off"
                maxLength={60}
                placeholder={t.household.aliasPlaceholder}
              />
            </div>
            <RegistrationTextField
              {...field('phoneNumber')}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="987 654 321"
            />
            <RegistrationTextField
              {...field('contactEmail')}
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t.common.emailPlaceholder}
            />
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-bold text-alivia-primary">
              {t.household.locationSection}
            </legend>
            <div className="sm:col-span-2">
              <RegistrationTextField
                {...field('address')}
                autoComplete="street-address"
                maxLength={160}
                placeholder={t.household.addressPlaceholder}
              />
            </div>
            <RegistrationTextField {...field('district')} autoComplete="address-level3" />
            <RegistrationTextField {...field('city')} autoComplete="address-level2" />
          </fieldset>

          <AuthSubmitButton label={t.household.submit} loading={status === 'submitting'} />
        </form>
      </div>
    </RegistrationLayout>
  );
}
