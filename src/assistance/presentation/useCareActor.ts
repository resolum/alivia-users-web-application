import { useLoad } from '@/shared/presentation/hooks/useLoad.ts';
import { useSession } from '@/shared/presentation/hooks/useSession.ts';
import { loadCareNetwork } from '../application/assistance.store.ts';
import { resolveActor } from '../application/care-coordination.store.ts';

/** The care network and the caregiver acting in this session, for screens that check permissions. */
export function useCareActor() {
  const { accessLevel, user } = useSession();
  const network = useLoad(loadCareNetwork, []);
  const data = network.state.status === 'ready' ? network.state.data : null;
  const actor = data ? resolveActor(data, accessLevel, user?.displayName) : null;
  return { network: data, actor, status: network.state.status, retry: network.retry } as const;
}
