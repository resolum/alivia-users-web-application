import type { User } from './user.entity.ts';

export interface AuthSession {
  readonly user: User;
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly permissions: readonly string[];
}
