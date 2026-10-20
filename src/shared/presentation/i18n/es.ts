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
} as const;

export type Translations = DeepStringMap<typeof es>;
export type NavLabelKey = keyof typeof es.nav.items;
export type NavGroupLabelKey = keyof typeof es.nav.groups;
export type NavHeaderLabelKey = keyof typeof es.nav.header;
