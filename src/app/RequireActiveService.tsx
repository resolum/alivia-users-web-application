import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { loadMyContracting, NO_REQUEST_PATH } from '@/subscriptions/index.ts';
import { Spinner } from '@/shared/presentation/components/ui/index.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';

// shortcut: VITE_SKIP_SERVICE_GATE=true opens the platform without an active service, while no technician can approve an installation; development only.
const SKIP_GATE = import.meta.env.VITE_SKIP_SERVICE_GATE === 'true';

type Gate = { readonly state: 'checking' } | { readonly state: 'open' } | { readonly state: 'closed'; readonly to: string };

/**
 * Keeps the caregiver platform closed for the family that contracts until its request reached Activación:
 * meanwhile it goes back to the step it is on (plan, configuration or tracking). Invited caregivers join an
 * active household, so they go straight in. It checks once per entry to the platform.
 */
export function RequireActiveService() {
  const { accessLevel, user } = useSession();
  const contracts = accessLevel === 'principal' && !SKIP_GATE;
  const account = user?.id ?? '';
  // The answer is kept with the account it belongs to, so another account starts checking again.
  const [checked, setChecked] = useState<{ readonly account: string; readonly gate: Gate } | null>(null);

  useEffect(() => {
    if (!contracts) return;
    let active = true;
    const settle = (gate: Gate) => { if (active) setChecked({ account, gate }); };
    loadMyContracting()
      .then((mine) => {
        if (mine === null) settle({ state: 'closed', to: NO_REQUEST_PATH });
        else if (mine.pendingPath === null) settle({ state: 'open' });
        else settle({ state: 'closed', to: mine.pendingPath });
      })
      // If the status cannot be read, the platform stays open rather than locking the family out.
      .catch(() => settle({ state: 'open' }));
    return () => { active = false; };
  }, [contracts, account]);

  const gate: Gate = !contracts ? { state: 'open' } : checked?.account === account ? checked.gate : { state: 'checking' };
  if (gate.state === 'checking') {
    return <div className="grid min-h-dvh place-items-center bg-alivia-page"><Spinner label="Verificando el estado de tu contratación…" /></div>;
  }
  if (gate.state === 'closed') return <Navigate to={gate.to} replace />;
  return <Outlet />;
}
