import { ICON_PATHS, type NavIconName } from './icon-paths.ts';

interface IconProps {
  readonly name: NavIconName;
  readonly className?: string;
}

/** Decorative outline icon rendered with a uniform 1.75 stroke. */
export function Icon({ name, className = 'size-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {ICON_PATHS[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}
