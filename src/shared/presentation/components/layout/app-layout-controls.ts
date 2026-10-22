import { createContext, useContext } from 'react';

/** Controls that the shared shell exposes to its app-owned top bar. */
export interface AppLayoutControls {
  readonly menuOpen: boolean;
  readonly onMenuOpen: () => void;
  readonly menuButtonRef: (node: HTMLButtonElement | null) => void;
}

export const AppLayoutControlsContext =
  createContext<AppLayoutControls | null>(null);

/** Reads the shell controls from an app-owned top bar. */
export function useAppLayoutControls(): AppLayoutControls {
  const controls = useContext(AppLayoutControlsContext);
  if (!controls) {
    throw new Error('useAppLayoutControls must be used inside AppLayout.');
  }
  return controls;
}
