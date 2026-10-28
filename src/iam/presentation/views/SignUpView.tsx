import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import {
  Checkbox,
  PasswordField,
} from '@/shared/presentation/components/base-form/index.ts';
import { useDocumentTitle } from '@/shared/presentation/hooks/useDocumentTitle.ts';
import { getRegistrationProgress, signUp } from '../../application/iam.store.ts';
import type { FieldErrors } from '../../domain/model/field-errors.ts';
import { IamError } from '../../domain/model/iam-error.ts';
import { evaluatePassword, passwordsMatch } from '../../domain/model/password-policy.ts';
import { SignUpCommand, type SignUpField } from '../../domain/model/sign-up.command.ts';
import { AuthErrorAlert } from '../components/AuthErrorAlert.tsx';
import { AuthField } from '../components/AuthField.tsx';
import { AuthFormHeader } from '../components/AuthFormHeader.tsx';
import { AuthSubmitButton } from '../components/AuthSubmitButton.tsx';
import { PasswordRequirements } from '../components/PasswordRequirements.tsx';
import { RegistrationLayout } from '../components/RegistrationLayout.tsx';
import { RegistrationTextField } from '../components/RegistrationTextField.tsx';
import { fieldErrorMessage, focusFirstInvalid } from '../field-error-message.ts';
import { useIamTranslations } from '../hooks/useIamTranslations.ts';
import { useSubmission } from '../hooks/useSubmission.ts';

type SignUpFormField = SignUpField | 'confirmPassword';

const FIELD_ORDER: readonly SignUpFormField[] = [
  'firstName',
  'lastName',
  'emailAddress',
  'phoneNumber',
  'dni',
  'birthDate',
  'password',
  'confirmPassword',
  'acceptedTerms',
];

const ID_PREFIX = 'sign-up';

interface SignUpValues {
  readonly firstName: string;
  readonly lastName: string;
  readonly emailAddress: string;
  readonly phoneNumber: string;
  readonly dni: string;
  readonly birthDate: string;
  readonly password: string;
  readonly confirmPassword: string;
}

const EMPTY_VALUES: SignUpValues = {
  firstName: '',
  lastName: '',
  emailAddress: '',
  phoneNumber: '',
  dni: '',
  birthDate: '',
  password: '',
  confirmPassword: '',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SignUpView() {
  const t = useIamTranslations();
  useDocumentTitle(t.signUp.title);
  const navigate = useNavigate();
  const { status, errorKey, run } = useSubmission();
  const [values, setValues] = useState<SignUpValues>(EMPTY_VALUES);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<SignUpFormField>>({});

  // A responsible client who already created the household resumes at configuration.
  if (getRegistrationProgress()?.householdId) {
    return <Navigate to="/contract/configuration" replace />;
  }

  const emailTaken = errorKey === 'emailAlreadyRegistered';

  function change(field: keyof SignUpValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const command = new SignUpCommand({ ...values, acceptedTerms });
    const nextErrors: FieldErrors<SignUpFormField> = command.validate();
    if (values.confirmPassword === '') nextErrors.confirmPassword = 'required';
    else if (!passwordsMatch(values.password, values.confirmPassword)) {
      nextErrors.confirmPassword = 'password_mismatch';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstInvalid(FIELD_ORDER, nextErrors, ID_PREFIX);
      return;
    }

    void run(async () => {
      try {
        await signUp(command);
      } catch (error) {
        if (error instanceof IamError) {
          setErrors((current) => ({ ...current, ...error.fieldErrors }));
        }
        throw error;
      }
    }).then((successful) => {
      if (successful) void navigate('/sign-up/email-sent');
    });
  }

  const message = (field: SignUpFormField) => fieldErrorMessage(t, errors[field]);

  return (
    <RegistrationLayout step={2}>
      <div className="space-y-6">
        <AuthFormHeader title={t.signUp.title} subtitle={t.signUp.subtitle} />

        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
          {emailTaken ? (
            <div role="alert" className="space-y-3 rounded-xl bg-alivia-danger/10 px-4 py-3 text-sm">
              <p className="font-semibold text-alivia-danger">{t.signUp.alreadyRegisteredTitle}</p>
              <p className="text-alivia-text">{t.signUp.alreadyRegisteredBody}</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                <Link to="/sign-in" className="inline-flex min-h-11 items-center font-semibold text-alivia-primary underline-offset-4 hover:underline">
                  {t.signUp.goToSignIn}
                </Link>
                <Link to="/recover-password" className="inline-flex min-h-11 items-center font-semibold text-alivia-primary underline-offset-4 hover:underline">
                  {t.signUp.recoverAccess}
                </Link>
              </div>
            </div>
          ) : (
            errorKey && <AuthErrorAlert message={t.errors[errorKey]} />
          )}

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-3 text-sm font-bold text-alivia-primary">
              {t.signUp.personalSection}
            </legend>
            <RegistrationTextField
              id={`${ID_PREFIX}-firstName`}
              label={t.signUp.firstNameLabel}
              autoComplete="given-name"
              maxLength={75}
              value={values.firstName}
              onValueChange={(value) => change('firstName', value)}
              error={message('firstName')}
            />
            <RegistrationTextField
              id={`${ID_PREFIX}-lastName`}
              label={t.signUp.lastNameLabel}
              autoComplete="family-name"
              maxLength={75}
              value={values.lastName}
              onValueChange={(value) => change('lastName', value)}
              error={message('lastName')}
            />
            <div className="sm:col-span-2">
              <RegistrationTextField
                id={`${ID_PREFIX}-emailAddress`}
                label={t.common.emailLabel}
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={254}
                placeholder={t.common.emailPlaceholder}
                value={values.emailAddress}
                onValueChange={(value) => change('emailAddress', value)}
                error={message('emailAddress')}
              />
            </div>
            <div className="sm:col-span-2">
              <RegistrationTextField
                id={`${ID_PREFIX}-phoneNumber`}
                label={t.signUp.phoneLabel}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="987 654 321"
                value={values.phoneNumber}
                onValueChange={(value) => change('phoneNumber', value)}
                error={message('phoneNumber')}
                hint={t.signUp.phoneHint}
              />
            </div>
            <RegistrationTextField
              id={`${ID_PREFIX}-dni`}
              label={t.signUp.dniLabel}
              inputMode="numeric"
              autoComplete="off"
              maxLength={8}
              value={values.dni}
              onValueChange={(value) => change('dni', value)}
              error={message('dni')}
            />
            <RegistrationTextField
              id={`${ID_PREFIX}-birthDate`}
              label={t.signUp.birthDateLabel}
              type="date"
              autoComplete="bday"
              max={todayIso()}
              value={values.birthDate}
              onValueChange={(value) => change('birthDate', value)}
              error={message('birthDate')}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4">
            <legend className="mb-3 text-sm font-bold text-alivia-primary">
              {t.signUp.accessSection}
            </legend>
            <AuthField
              id={`${ID_PREFIX}-password`}
              label={t.signUp.passwordLabel}
              required
              requiredLabel={t.common.required}
              error={message('password')}
            >
              <PasswordField
                id={`${ID_PREFIX}-password`}
                name="password"
                autoComplete="new-password"
                required
                value={values.password}
                aria-invalid={errors.password !== undefined}
                aria-describedby={errors.password ? `${ID_PREFIX}-password-error` : undefined}
                onChange={(event) => change('password', event.target.value)}
                showPasswordLabel={t.common.showPassword}
                hidePasswordLabel={t.common.hidePassword}
              />
            </AuthField>
            <PasswordRequirements requirements={evaluatePassword(values.password)} />
            <AuthField
              id={`${ID_PREFIX}-confirmPassword`}
              label={t.signUp.confirmLabel}
              required
              requiredLabel={t.common.required}
              error={message('confirmPassword')}
            >
              <PasswordField
                id={`${ID_PREFIX}-confirmPassword`}
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={values.confirmPassword}
                aria-invalid={errors.confirmPassword !== undefined}
                aria-describedby={errors.confirmPassword ? `${ID_PREFIX}-confirmPassword-error` : undefined}
                onChange={(event) => change('confirmPassword', event.target.value)}
                showPasswordLabel={t.common.showPassword}
                hidePasswordLabel={t.common.hidePassword}
              />
            </AuthField>
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <Checkbox
              id={`${ID_PREFIX}-acceptedTerms`}
              label={t.signUp.terms}
              checked={acceptedTerms}
              aria-invalid={errors.acceptedTerms !== undefined}
              aria-describedby={errors.acceptedTerms ? `${ID_PREFIX}-acceptedTerms-error` : undefined}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setErrors((current) => ({ ...current, acceptedTerms: undefined }));
              }}
            />
            {errors.acceptedTerms && (
              <p id={`${ID_PREFIX}-acceptedTerms-error`} role="alert" className="text-xs font-medium text-alivia-danger">
                {message('acceptedTerms')}
              </p>
            )}
          </div>

          <AuthSubmitButton label={t.signUp.submit} loading={status === 'submitting'} />
        </form>
      </div>
    </RegistrationLayout>
  );
}
