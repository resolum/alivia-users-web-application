import { Camera, RefreshCw } from 'lucide-react';
import { Avatar, Card, Chip } from '@/shared/presentation/components/ui/index.ts';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';
import type { AccessLevel } from '@/shared/presentation/session/session.types.ts';
import type { PersonProfile } from '../../domain/model/person-profile.entity.ts';

interface ProfileHeaderCardProps {
  readonly profile: PersonProfile;
  readonly accessLevel: AccessLevel;
  readonly onChangePhoto: () => void;
}

export function ProfileHeaderCard({ profile, accessLevel, onChangePhoto }: ProfileHeaderCardProps) {
  const t = useTranslations();
  const p = t.profiles;
  const roleLabel = accessLevel === 'principal' ? t.nav.roles.principal : t.nav.roles.guest;

  return (
    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="relative shrink-0 self-start sm:self-auto">
        <Avatar
          name={profile.fullName}
          src={profile.photoUrl ?? undefined}
          size="lg"
          className="size-16! text-xl"
        />
        <button
          type="button"
          onClick={onChangePhoto}
          aria-label={p.header.changePhotoOf.replace('{name}', profile.fullName)}
          className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full border-2 border-white bg-alivia-primary text-white transition-[background-color,scale] duration-150 hover:bg-alivia-primary-mid active:scale-95"
        >
          <Camera className="size-4" aria-hidden="true" />
        </button>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xl font-bold break-words text-alivia-primary">{profile.fullName}</p>
        <div className="flex flex-wrap gap-2">
          <Chip tone="neutral" icon="careNetwork">
            {roleLabel}
          </Chip>
          {/* Only verified accounts can sign in, so the session email is verified. */}
          <Chip tone="success" icon="check">
            {p.header.emailVerified}
          </Chip>
        </div>
      </div>

      <button
        type="button"
        onClick={onChangePhoto}
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-3 text-sm font-semibold text-alivia-primary-mid transition-colors hover:bg-alivia-primary-mist sm:self-auto"
      >
        <RefreshCw className="size-4" aria-hidden="true" />
        {p.header.changePhoto}
      </button>
    </Card>
  );
}
