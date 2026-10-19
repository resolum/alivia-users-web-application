type DeepStringMap<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringMap<T[K]>;
};

export const es = {
  nav: {
    home: 'Inicio',
    assistedPerson: 'Persona asistida',
    careNetwork: 'Red de cuidado',
    activities: 'Actividades',
    household: 'Hogar',
    subscription: 'Suscripción',
    devices: 'Dispositivos',
    incidents: 'Incidencias',
    metrics: 'Métricas',
    notifications: 'Notificaciones',
    profile: 'Mi perfil',
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
    notifications: 'Notificaciones',
  },
} as const;

export type Translations = DeepStringMap<typeof es>;
