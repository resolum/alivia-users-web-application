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
    roles: {
      principal: 'Cuidador Principal',
      guest: 'Cuidador',
      support: 'Cuidador de apoyo',
    },
    mainNavigation: 'Navegación principal',
    notificationsUnread: 'Notificaciones, {count} sin leer',
    notificationsUnreadNoCount: 'Notificaciones, hay sin leer',
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
      title: 'Ingresa a tu cuenta',
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
      submit: 'Enviar enlace de recuperación',
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
        heading: 'Tu contraseña necesita',
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
      linkMissingTitle: 'Este enlace no funciona',
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
    registration: {
      progressLabel: 'Progreso de contratación',
      stepOf: 'Paso {current} de {total}',
      steps: {
        plan: 'Plan',
        account: 'Cuenta',
        household: 'Hogar',
        configuration: 'Configuración',
        evaluation: 'Evaluación',
      },
      haveAccount: '¿Ya tienes una cuenta?',
      signIn: 'Iniciar sesión',
      brandLabel: 'Alivia, volver a los planes',
    },
    fieldErrors: {
      required: 'Este campo es obligatorio.',
      invalidEmail: 'Ingresa un correo electrónico válido.',
      weakPassword: 'La contraseña no cumple todos los requisitos.',
      passwordMismatch: 'Las contraseñas no coinciden.',
      termsNotAccepted: 'Acepta los términos para continuar.',
      invalidPhone: 'Ingresa un celular válido, por ejemplo 987 654 321.',
      invalidDni: 'El DNI debe tener 8 dígitos.',
      invalidDate: 'Ingresa una fecha válida que no sea futura.',
      tooLong: 'El texto es demasiado largo.',
      alreadyRegistered: 'Este dato ya está registrado.',
      invalid: 'Revisa este dato.',
    },
    signUp: {
      title: 'Crea tu cuenta de responsable',
      subtitle:
        'Con estos datos identificamos a quien contrata y administra el servicio del hogar.',
      personalSection: 'Tus datos',
      accessSection: 'Acceso a tu cuenta',
      firstNameLabel: 'Nombres',
      lastNameLabel: 'Apellidos',
      phoneLabel: 'Celular',
      phoneHint: 'Si es de otro país, inclúyelo con su código, por ejemplo +34.',
      dniLabel: 'DNI',
      birthDateLabel: 'Fecha de nacimiento',
      passwordLabel: 'Contraseña', // NOSONAR
      confirmLabel: 'Confirmar contraseña', // NOSONAR
      terms:
        'Acepto los términos y condiciones y la política de privacidad de Alivia.',
      submit: 'Crear cuenta y enviar verificación',
      alreadyRegisteredTitle: 'Ese correo ya tiene una cuenta.',
      alreadyRegisteredBody:
        'Inicia sesión con él o recupera tu acceso si no recuerdas la contraseña.',
      goToSignIn: 'Iniciar sesión',
      recoverAccess: 'Recuperar acceso',
    },
    emailSent: {
      title: 'Revisa tu correo',
      body: 'Enviamos un enlace a {email}. Abre el mensaje y pulsa «Verificar correo» para continuar con la contratación.',
      hint: 'Si no aparece en unos minutos, revisa las carpetas de spam o promociones.',
      wrongEmail: '¿Escribiste mal tu correo?',
      registerAgain: 'Registrarme de nuevo',
      noRegistration:
        'No encontramos un registro en curso en este navegador. Escribe tu correo para recibir un enlace nuevo.',
    },
    resend: {
      title: '¿No te llegó el correo?',
      emailLabel: 'Correo registrado',
      submit: 'Reenviar correo de verificación',
      wait: 'Podrás reenviarlo en {seconds} s',
      sent: 'Si el correo está registrado y pendiente de verificación, te enviamos un enlace nuevo. El anterior ya no funciona.',
    },
    verifyEmail: {
      title: 'Verificando tu correo',
      checking: 'Estamos confirmando tu enlace…',
      failedTitle: 'No pudimos verificar tu correo',
      failedBody:
        'El enlace no es válido o perdió su vigencia. Solicita un nuevo correo de verificación.',
      missingToken:
        'El enlace está incompleto. Ábrelo de nuevo desde el correo o solicita uno nuevo.',
      alreadyVerified: 'Tu correo ya estaba verificado. Inicia sesión para continuar.',
    },
    household: {
      title: 'Registra la cuenta de tu hogar',
      subtitle:
        'Es la cuenta compartida de la vivienda. Tu usuario quedará vinculado como responsable autorizado.',
      verifiedBanner: 'Correo verificado. Ya puedes registrar tu hogar.',
      contactSection: 'Contacto del hogar',
      locationSection: 'Ubicación de la vivienda',
      aliasLabel: 'Nombre del hogar',
      aliasPlaceholder: 'Ejemplo: Casa de mamá',
      phoneLabel: 'Teléfono de contacto',
      contactEmailLabel: 'Correo de contacto',
      addressLabel: 'Dirección',
      addressPlaceholder: 'Calle, número, piso o interior',
      districtLabel: 'Distrito',
      cityLabel: 'Ciudad',
      submit: 'Guardar hogar y continuar',
      pendingTitle: 'Completa estos datos para continuar al pago:',
      notVerifiedTitle: 'Primero verifica tu correo',
      notVerifiedBody:
        'Para crear la cuenta del hogar necesitamos confirmar tu correo con el enlace que te enviamos.',
      goToEmailSent: 'Ver cómo verificar mi correo',
      startSignUp: 'Crear mi cuenta',
    },
    errors: {
      invalidCredentials: 'El correo o la contraseña son incorrectos.',
      emailNotVerified: 'Debes verificar tu correo antes de ingresar.',
      accountPending:
        'Tu cuenta está pendiente de verificación o de definir tu contraseña.',
      accountBlocked: 'Tu cuenta está bloqueada. Contacta a soporte.',
      accountDeactivated: 'Tu cuenta está desactivada. Contacta a soporte.',
      emailAlreadyRegistered: 'Ese correo ya está registrado.',
      emailAlreadyVerified: 'Ese correo ya fue verificado. Inicia sesión para continuar.',
      invalidVerificationCode:
        'El enlace de verificación no es válido o ya se usó. Solicita un nuevo correo.',
      verificationCodeExpired:
        'El enlace de verificación venció. Solicita un nuevo correo.',
      invalidPasswordToken:
        'El enlace de recuperación no es válido. Solicita uno nuevo.',
      passwordTokenExpired:
        'El enlace de recuperación venció. Solicita uno nuevo.',
      roleNotAllowed: 'Tu rol no tiene acceso a este portal.',
      rateLimited:
        'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      validationFailed: 'Revisa los campos marcados.',
      serviceUnavailable:
        'El servicio no está disponible en este momento. Inténtalo en unos minutos.',
      network: 'No pudimos conectar con el servidor. Revisa tu conexión.',
      configuration:
        'La aplicación no está configurada correctamente. Contacta a soporte.',
      unknown: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    },
  },
  home: {
    meta: {
      title: 'Inicio',
    },
    greeting: {
      hello: 'Hola, {name}',
      helloNoName: 'Hola',
    },
    principal: {
      summaryLabel: 'RESUMEN DE HOY',
      reportIncident: 'Reportar incidencia',
      newActivity: 'Nueva actividad',
    },
    panel: {
      assistedPersonLabel: 'PERSONA ASISTIDA',
      viewProfile: 'Ver perfil',
      today: 'Hoy',
      agendaLabel: 'Actividades de hoy',
      scheduledActivity: '{count} actividad programada',
      scheduledActivities: '{count} actividades programadas',
      viewAgenda: 'Ver agenda completa',
      selectorLabel: 'Seleccionar persona asistida',
      emptyTitle: 'Aún no hay una persona asistida registrada',
      emptyAction: 'Registrar persona asistida',
      emptyAgenda: 'No hay actividades programadas para hoy.',
    },
    timeline: {
      responsible: 'Responsable: {name}',
    },
    alert: {
      extraSituation: '+{count} situación más',
      extraSituations: '+{count} situaciones más',
      viewDevice: 'Ver dispositivo',
    },
    event: {
      label: 'PRÓXIMO EVENTO',
      technician: 'Técnico asignado',
      viewFollowUp: 'Ver seguimiento',
    },
    guest: {
      welcome:
        '¡Bienvenido a Alivia! Nos alegra contar con tu apoyo en el cuidado diario.',
      nextActivityIntro: 'Esta es tu próxima actividad',
      careFor: 'Cuidado de {name}',
      nextActivityLabel: 'PRÓXIMA ACTIVIDAD',
      viewActivity: 'Ver actividad',
      viewMyActivities: 'Ver mis actividades',
      emptyTitle: 'No tienes actividades próximas',
      emptyDescription:
        'Cuando tengas una actividad asignada, aparecerá aquí.',
    },
    status: {
      scheduled: 'Programada',
      inProgress: 'En curso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      missed: 'No realizada',
    },
    dates: {
      today: 'Hoy',
      tomorrow: 'Mañana',
      overnight: 'hasta el día siguiente',
    },
    states: {
      loading: 'Cargando…',
      errorTitle: 'No pudimos cargar tu inicio',
      errorMessage: 'Inténtalo de nuevo en unos momentos.',
      retry: 'Reintentar',
    },
  },
  profiles: {
    title: 'Mi perfil',
    subtitle: 'Consulta y actualiza tu información personal',
    breadcrumbHome: 'Inicio',
    breadcrumbLabel: 'Ruta de navegación',
    unsavedChanges: 'Cambios sin guardar',
    header: {
      changePhoto: 'Cambiar foto',
      changePhotoOf: 'Cambiar foto de {name}',
      emailVerified: 'Correo verificado',
    },
    form: {
      sectionTitle: 'Datos personales',
      requiredLegend: 'Obligatorio',
      firstName: 'Nombres',
      firstNameHint: 'Tal como figura en el documento oficial',
      lastName: 'Apellidos',
      lastNameHint: 'Apellidos paterno y materno',
      dni: 'DNI',
      dniHint: 'Validado en tu registro. Para corregirlo contacta con soporte.',
      phoneNumber: 'Teléfono de contacto',
      phoneHint: 'Utilizado para alertas de asistencia y urgencias',
      email: 'Correo electrónico',
      emailHint: 'Para modificar tu correo electrónico principal contacta con soporte.',
      emailLocked: 'Verificado (no editable)',
      cancel: 'Cancelar',
      save: 'Guardar cambios',
      saved: 'Cambios guardados',
    },
    photo: {
      title: 'Actualizar fotografía',
      close: 'Cerrar',
      preview: 'Vista previa de imagen',
      dropTitle: 'Arrastra una imagen o selecciónala',
      dropHint: 'JPG o PNG (máximo 5MB)',
      replace: 'Reemplazar',
      remove: 'Eliminar foto actual',
      removeQueued: 'La foto se eliminará al guardar.',
      cancel: 'Cancelar',
      save: 'Guardar foto',
      saved: 'Foto actualizada',
      removed: 'Foto eliminada',
    },
    fieldErrors: {
      required: 'Este campo es obligatorio.',
      too_short: 'Ingresa al menos 2 caracteres.',
      too_long: 'Es demasiado largo.',
      invalid_phone: 'Ingresa un celular válido, por ejemplo +51 984 123 456.',
      invalid_photo_type: 'Solo se aceptan imágenes JPG o PNG.',
      photo_too_large: 'La imagen pesa más de 5MB.',
    },
    errors: {
      validation_failed: 'Revisa los campos marcados.',
      forbidden: 'No tienes permiso para modificar este perfil.',
      not_found: 'No encontramos tu perfil.',
      photo_upload_unavailable: 'La subida de fotos aún no está disponible.',
      network: 'No pudimos conectar con el servidor. Revisa tu conexión.',
      unknown: 'Ocurrió un error inesperado. Inténtalo de nuevo.',
    },
    states: {
      loading: 'Cargando tu perfil…',
      errorTitle: 'No pudimos cargar tu perfil',
      retry: 'Reintentar',
    },
  },
} as const;

export type Translations = DeepStringMap<typeof es>;
export type NavLabelKey = keyof typeof es.nav.items;
export type NavGroupLabelKey = keyof typeof es.nav.groups;
export type NavHeaderLabelKey = keyof typeof es.nav.header;
