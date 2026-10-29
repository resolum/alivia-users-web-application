import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Check, CloudUpload, ImageIcon, Trash2 } from 'lucide-react';
import { Avatar, Button } from '@/shared/presentation/components/ui/index.ts';
import { useTranslations } from '@/shared/presentation/i18n/index.ts';
import { removeProfilePhoto, uploadProfilePhoto } from '../../application/profiles.store.ts';
import type { PersonProfile } from '../../domain/model/person-profile.entity.ts';
import { ProfileError, type ProfileFieldErrorCode, type ProfileErrorCode } from '../../domain/model/profile-error.ts';
import { checkProfilePhoto, PROFILE_PHOTO_TYPES } from '../../domain/model/profile-photo.ts';
import { ProfileDialog } from './ProfileDialog.tsx';

interface PhotoUploadDialogProps {
  readonly open: boolean;
  readonly profile: PersonProfile;
  readonly onClose: () => void;
  readonly onSaved: (profile: PersonProfile, notice: string) => void;
}

export function PhotoUploadDialog({ open, profile, onClose, onSaved }: PhotoUploadDialogProps) {
  const t = useTranslations().profiles;
  return (
    <ProfileDialog open={open} title={t.photo.title} closeLabel={t.photo.close} onClose={onClose}>
      <PhotoUploadBody profile={profile} onClose={onClose} onSaved={onSaved} />
    </ProfileDialog>
  );
}

/** Mounted only while the dialog is open, so each opening starts clean. */
function PhotoUploadBody({ profile, onClose, onSaved }: Omit<PhotoUploadDialogProps, 'open'>) {
  const t = useTranslations().profiles;
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);
  const [error, setError] = useState<ProfileFieldErrorCode | ProfileErrorCode | null>(null);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

  // Frees the previous preview when it is replaced and the last one on close.
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const pick = (candidate: File | undefined) => {
    if (!candidate) return;
    const problem = checkProfilePhoto(candidate);
    setError(problem);
    if (problem) return;
    setFile(candidate);
    setPreviewUrl(URL.createObjectURL(candidate));
    setRemoveRequested(false);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files[0]);
  };

  const shownPhoto = removeRequested ? undefined : (file ? previewUrl : profile.photoUrl) ?? undefined;
  const canRemove = profile.photoUrl !== null && !removeRequested && !file;

  const save = async () => {
    setSaving(true);
    try {
      const updated = file ? await uploadProfilePhoto(profile, file) : await removeProfilePhoto(profile);
      onSaved(updated, file ? t.photo.saved : t.photo.removed);
    } catch (caught) {
      setError(caught instanceof ProfileError ? caught.code : 'unknown');
      setSaving(false);
    }
  };

  const errorText = error
    ? error in t.fieldErrors
      ? t.fieldErrors[error as ProfileFieldErrorCode]
      : t.errors[error as ProfileErrorCode]
    : null;

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <Avatar
          name={profile.fullName}
          src={shownPhoto}
          className="size-24! text-2xl ring-4 ring-alivia-primary-mist"
        />
        <p className="text-[11px] font-semibold tracking-[0.12em] text-alivia-text-muted uppercase">
          {t.photo.preview}
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_PHOTO_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-describedby={errorText ? 'photo-error' : undefined}
        className={[
          'flex flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center',
          'transition-[background-color,border-color] duration-150',
          dragging
            ? 'border-alivia-primary-mid bg-alivia-primary-mist'
            : 'border-alivia-primary-light/60 bg-alivia-primary-mist/50 hover:border-alivia-primary-light',
        ].join(' ')}
      >
        <CloudUpload className="mb-1 size-7 text-alivia-primary-mid" aria-hidden="true" />
        <span className="text-sm font-semibold text-alivia-text">{t.photo.dropTitle}</span>
        <span className="text-xs text-alivia-hint">{t.photo.dropHint}</span>
      </button>

      {errorText && (
        <p id="photo-error" role="alert" className="animate-notice-in -mt-2 text-sm font-medium text-alivia-danger">
          {errorText}
        </p>
      )}
      {removeRequested && (
        <p role="status" className="-mt-2 text-sm text-alivia-text-muted">
          {t.photo.removeQueued}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-alivia-primary transition-colors hover:bg-alivia-primary-mist"
        >
          <ImageIcon className="size-4" aria-hidden="true" />
          {t.photo.replace}
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={() => {
              setRemoveRequested(true);
              setError(null);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-alivia-danger transition-colors hover:bg-alivia-danger/10"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            {t.photo.remove}
          </button>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-alivia-primary-mist pt-5 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onClose} className="min-h-11">
          {t.photo.cancel}
        </Button>
        <Button
          loading={saving}
          disabled={(!file && !removeRequested) || saving}
          onClick={save}
          className="min-h-11"
        >
          {!saving && <Check className="size-4" aria-hidden="true" />}
          {t.photo.save}
        </Button>
      </div>
    </>
  );
}
