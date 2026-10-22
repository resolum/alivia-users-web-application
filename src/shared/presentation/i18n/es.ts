type DeepStringMap<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringMap<T[K]>;
};

export const es = {
  nav: {
    items: {
      home: 'Inicio',
      assistedPerson: 'Persona asistida',
      careNetwork: 'Red de cuidado',
      activities: 'Actividades',
      household: 'Hogar',
      devices: 'Dispositivos',
      contracting: 'Contratación',
      subscription: 'Suscripción',
      incidents: 'Incidencias',
      metrics: 'Métricas',
      profile: 'Mi perfil',
      notifications: 'Notificaciones',
    },
    groups: {
      principal: 'PRINCIPAL',
      care: 'CUIDADO',
      home: 'HOGAR',
      service: 'SERVICIO',
      analytics: 'ANALÍTICA',
      account: 'CUENTA',
    },
    header: {
      appName: 'Alivia',
      principalSubtitle: 'Web del Cuidador',
      guestSubtitle: 'Cuidador',
      guestBadge: 'INVITADO',
    },
    mainNavigation: 'Navegación principal',
    notificationsUnread: 'Notificaciones, {count} sin leer',
    language: 'Idioma',
    signOut: 'Cerrar sesión',
  },
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    retry: 'Reintentar',
    back: 'Volver',
    loading: 'Cargando…',
  },
  errors: {
    generic: 'Algo salió mal. Por favor, inténtalo de nuevo.',
    notFound: 'No se encontró lo que buscabas.',
    unauthorized: 'No tienes permiso para ver esta sección.',
    network: 'Error de conexión. Comprueba tu red e inténtalo de nuevo.',
    empty: 'No hay nada aquí todavía.',
  },
  layout: {
    skipToContent: 'Saltar al contenido',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    userMenu: 'Menú de usuario',
    comingSoon: 'Esta sección estará disponible próximamente.',
  },
  iam: {
    auth: {
      brand: 'alivia',
      footer: 'Alivia Asistencia & Salud S.A.C.',
      portalLabel: 'PORTAL DEL CUIDADOR',
    },
    common: {
      loading: 'Cargando…',
      emailLabel: 'Correo electrónico',
      emailPlaceholder: 'ejemplo@correo.pe',
      showPassword: 'Mostrar contraseña',
      hidePassword: 'Ocultar contraseña',
      required: 'Obligatorio',
      backToSignIn: 'Volver a iniciar sesión',
      emailRequired: 'Ingresa tu correo electrónico.',
      emailInvalid: 'Ingresa un correo electrónico válido.',
    },
    signIn: {
      title: 'Bienvenido a Alivia',
      subtitle: 'Administra el cuidado y el servicio de tu hogar.',
      credentialLabel: 'Contraseña', // NOSONAR
      remember: 'Recordarme en este dispositivo',
      forgotPassword: '¿Olvidaste tu contraseña?',
      submit: 'Iniciar sesión',
      noAccount: '¿Aún no tienes una cuenta?',
      plans: 'Conoce nuestros planes',
      errors: {
        passwordRequired: 'Este campo es obligatorio.',
      },
      showcase: {
        connected: 'Plataforma Asistiva Conectada',
        location: 'Lima, Perú',
        autonomy: 'Más autonomía.',
        tranquility: 'Más tranquilidad.',
        description:
          'Tecnología asistiva pensada para devolver el control y la serenidad a las familias.',
      },
    },
    forgotPassword: {
      title: 'Recuperar contraseña',
      subtitle: 'Ingresa el correo asociado a tu cuenta.',
      submit: 'Enviar código',
      confirmationTitle: 'Revisa tu correo',
      confirmation:
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    },
    resetPassword: {
      title: 'Crea una nueva contraseña',
      subtitle:
        'Por seguridad, elige una contraseña robusta que no hayas usado antes.',
      passwordLabel: 'Nueva contraseña',
      confirmLabel: 'Confirmar contraseña',
      submit: 'Cambiar contraseña',
      requirements: {
        heading: 'REQUISITOS DE SEGURIDAD',
        summary: 'Cumples {count} de 5 requisitos de seguridad.',
        items: {
          length: 'Al menos 8 caracteres',
          uppercase: 'Al menos una letra mayúscula',
          lowercase: 'Al menos una letra minúscula',
          digit: 'Al menos un número',
          special:
            'Al menos un carácter especial (@, $, !, %, *, ?, &, #)',
        },
      },
      errors: {
        passwordRequired: 'Ingresa una contraseña.',
        passwordWeak: 'La contraseña no cumple todos los requisitos.',
        confirmRequired: 'Confirma tu contraseña.',
        passwordMismatch: 'Las contraseñas no coinciden.',
      },
      tokenMissing:
        'El enlace de recuperación no es válido o está incompleto.',
      requestNewLink: 'Solicitar un enlace nuevo',
    },
    passwordUpdated: {
      title: 'Contraseña actualizada',
      message:
        'Tu contraseña ha sido restablecida con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.',
      submit: 'Ir a iniciar sesión',
    },
    errors: {
      invalidCredentials: 'El correo o la contraseña son incorrectos.',
      emailNotVerified: 'Debes verificar tu correo antes de ingresar.',
      accountPending:
        'Tu cuenta está pendiente de verificación o de definir tu contraseña.',
      accountBlocked: 'Tu cuenta está bloqueada. Contacta a soporte.',
      accountDeactivated: 'Tu cuenta está desactivada. Contacta a soporte.',
      emailAlreadyRegistered: 'Ese correo ya está registrado.',
      emailAlreadyVerified: 'Ese correo ya fue verificado.',
      invalidVerificationCode: 'El código de verificación no es válido.',
      verificationCodeExpired:
        'El código de verificación venció. Solicita uno nuevo.',
      invalidPasswordToken:
        'El enlace de recuperación no es válido. Solicita uno nuevo.',
      passwordTokenExpired:
        'El enlace de recuperación venció. Solicita uno nuevo.',
      roleNotAllowed: 'Tu rol no tiene acceso a este portal.',
      rateLimited:
        'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      network: 'No pudimos conectar con el servidor. Revisa tu conexión.',
      configuration:
        'La aplicación no está configurada correctamente. Contacta a soporte.',
      unknown: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    },
  },
} as const;

export type Translations = DeepStringMap<typeof es>;
export type NavLabelKey = keyof typeof es.nav.items;
export type NavGroupLabelKey = keyof typeof es.nav.groups;
export type NavHeaderLabelKey = keyof typeof es.nav.header;
