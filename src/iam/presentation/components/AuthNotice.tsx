import type { ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

type AuthNoticeTone = 'error' | 'success';

interface AuthNoticeProps {
  readonly tone: AuthNoticeTone;
  readonly children: ReactNode;
}

const toneClasses: Readonly<Record<AuthNoticeTone, string>> = {
  error: 'bg-alivia-danger/[0.07] text-alivia-danger',
  success: 'bg-alivia-mint text-alivia-secondary-deep',
};

/** Result of a submission: an error to fix or a confirmation. */
export function AuthNotice({ tone, children }: AuthNoticeProps) {
  const Icon = tone === 'error' ? CircleAlert : CircleCheck;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex animate-notice-in gap-3 rounded-lg px-4 py-3 text-sm leading-relaxed font-medium ${toneClasses[tone]}`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
