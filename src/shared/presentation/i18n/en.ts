import type { Translations } from './es.ts';

export const en: Translations = {
  nav: {
    items: {
      home: 'Home',
      assistedPerson: 'Assisted person',
      careNetwork: 'Care network',
      activities: 'Activities',
      household: 'Household',
      devices: 'Devices',
      contracting: 'Contracting',
      subscription: 'Subscription',
      incidents: 'Incidents',
      metrics: 'Metrics',
      profile: 'My profile',
      notifications: 'Notifications',
    },
    groups: {
      principal: 'PRINCIPAL',
      care: 'CARE',
      home: 'HOME',
      service: 'SERVICE',
      analytics: 'ANALYTICS',
      account: 'ACCOUNT',
    },
    header: {
      appName: 'Alivia',
      principalSubtitle: 'Caregiver Web',
      guestSubtitle: 'Caregiver',
      guestBadge: 'GUEST',
    },
    mainNavigation: 'Main navigation',
    notificationsUnread: 'Notifications, {count} unread',
    language: 'Language',
    signOut: 'Sign out',
  },
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    retry: 'Try again',
    back: 'Back',
    loading: 'Loading…',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    notFound: 'We could not find what you were looking for.',
    unauthorized: 'You do not have permission to view this section.',
    network: 'Connection error. Check your network and try again.',
    empty: 'Nothing here yet.',
  },
  layout: {
    skipToContent: 'Skip to content',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    userMenu: 'User menu',
    comingSoon: 'This section will be available soon.',
  },
  iam: {
    auth: {
      brand: 'alivia',
      footer: 'Alivia Asistencia & Salud S.A.C.',
      portalLabel: 'CAREGIVER PORTAL',
    },
    common: {
      loading: 'Loading…',
      emailLabel: 'Email address',
      emailPlaceholder: 'example@email.com',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      required: 'Required',
      backToSignIn: 'Back to sign in',
      emailRequired: 'Enter your email address.',
      emailInvalid: 'Enter a valid email address.',
    },
    signIn: {
      title: 'Welcome to Alivia',
      subtitle: 'Manage the care and service of your home.',
      passwordLabel: 'Password',
      remember: 'Remember me on this device',
      forgotPassword: 'Forgot your password?',
      submit: 'Sign in',
      noAccount: "Don't have an account yet?",
      plans: 'Explore our plans',
      errors: {
        passwordRequired: 'Enter your password.',
      },
      showcase: {
        connected: 'Connected Assistive Platform',
        location: 'Lima, Peru',
        autonomy: 'More autonomy.',
        tranquility: 'More peace of mind.',
        description:
          'Assistive technology designed to give families back control and serenity.',
      },
    },
    forgotPassword: {
      title: 'Recover password',
      subtitle: 'Enter the email associated with your account.',
      submit: 'Send code',
      confirmationTitle: 'Check your email',
      confirmation:
        'If the email is registered, you will receive instructions to reset your password.',
    },
    resetPassword: {
      title: 'Create a new password',
      subtitle:
        'For security, choose a strong password that you have not used before.',
      passwordLabel: 'New password',
      confirmLabel: 'Confirm password',
      submit: 'Change password',
      requirements: {
        heading: 'SECURITY REQUIREMENTS',
        summary: 'You meet {count} of 5 security requirements.',
        items: {
          length: 'At least 8 characters',
          uppercase: 'At least one uppercase letter',
          lowercase: 'At least one lowercase letter',
          digit: 'At least one number',
          special: 'At least one special character (@, $, !, %, *, ?, &, #)',
        },
      },
      errors: {
        passwordRequired: 'Enter a password.',
        passwordWeak: 'The password does not meet every requirement.',
        confirmRequired: 'Confirm your password.',
        passwordMismatch: 'Passwords do not match.',
      },
      tokenMissing: 'The recovery link is invalid or incomplete.',
      requestNewLink: 'Request a new link',
    },
    passwordUpdated: {
      title: 'Password updated',
      message:
        'Your password has been reset successfully. You can now sign in with your new credentials.',
      submit: 'Go to sign in',
    },
    errors: {
      invalidCredentials: 'The email or password is incorrect.',
      emailNotVerified: 'You must verify your email before signing in.',
      accountPending:
        'Your account is pending verification or password definition.',
      accountBlocked: 'Your account is blocked. Contact support.',
      accountDeactivated: 'Your account is deactivated. Contact support.',
      emailAlreadyRegistered: 'That email is already registered.',
      emailAlreadyVerified: 'That email has already been verified.',
      invalidVerificationCode: 'The verification code is not valid.',
      verificationCodeExpired:
        'The verification code expired. Request a new one.',
      invalidPasswordToken:
        'The recovery link is not valid. Request a new one.',
      passwordTokenExpired:
        'The recovery link expired. Request a new one.',
      roleNotAllowed: 'Your role does not have access to this portal.',
      rateLimited: 'Too many attempts. Wait a few minutes and try again.',
      network: 'We could not reach the server. Check your connection.',
      configuration:
        'The application is not configured correctly. Contact support.',
      unknown: 'Something unexpected happened. Please try again.',
    },
  },
};
