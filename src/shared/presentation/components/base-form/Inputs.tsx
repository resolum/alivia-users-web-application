import type { InputHTMLAttributes } from 'react';

const inputBase =
  'w-full rounded-lg border border-transparent bg-alivia-primary-mist/60 px-3 py-2 ' +
  // 16px on phones so iOS Safari does not zoom into the focused input.
  'text-base sm:text-sm text-alivia-text placeholder:text-alivia-text-soft ' +
  'transition-colors duration-150 ' +
  'hover:border-alivia-primary-light ' +
  'focus:border-alivia-primary-mid focus:bg-white focus:outline-none ' +
  'disabled:bg-alivia-mint disabled:cursor-not-allowed';

export { inputBase };

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputBase} {...props} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ options, placeholder, ...rest }: SelectProps) {
  return (
    <select className={inputBase} {...rest}>
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={4}
      className={`${inputBase} resize-y`}
      {...props}
    />
  );
}
