import type { InputHTMLAttributes } from 'react';

const inputBase =
  'w-full rounded-lg border border-alivia-primary-mist bg-white px-3 py-2 ' +
  'text-sm text-alivia-text placeholder:text-alivia-text-soft ' +
  'transition-colors duration-150 ' +
  'hover:border-alivia-primary-light ' +
  'focus:border-alivia-primary-mid focus:outline-none ' +
  'disabled:bg-alivia-mint disabled:cursor-not-allowed';

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
