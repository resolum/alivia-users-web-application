import { useSyncExternalStore } from 'react';
import {
  iamStore,
  type IamState,
} from '../../application/iam.store.ts';

/**
 * Subscribes the React tree to the IAM external store.
 *
 * The store is the only source of truth for session status and user data.
 */
export function useIamSession(): IamState {
  return useSyncExternalStore(
    iamStore.subscribe,
    iamStore.getState,
    iamStore.getState,
  );
}
