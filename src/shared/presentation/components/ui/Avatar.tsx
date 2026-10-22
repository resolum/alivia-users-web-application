type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  readonly name: string;
  readonly src?: string;
  readonly size?: AvatarSize;
  readonly className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
};

function getInitials(name: string): string {
  const words = name
    .trim()
    .split(' ')
    .filter((word) => word.length > 0);
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
  return initials || '?';
}

/** Decorative circular avatar with image fallback to initials. */
export function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: AvatarProps) {
  const classes = [
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
    'bg-alivia-primary-mist font-semibold text-alivia-primary',
    sizeClasses[size],
    className,
  ].join(' ');

  return (
    <span aria-hidden="true" className={classes}>
      {src ? (
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}
