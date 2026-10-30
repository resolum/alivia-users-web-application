import { RESPONSIBILITIES, type Responsibility } from '../../domain/model/caregiver.entity.ts';
import { RESPONSIBILITY_LABELS } from '../assistance-labels.ts';

interface ResponsibilityPickerProps {
  readonly legend: string;
  readonly value: readonly Responsibility[];
  readonly onChange: (value: Responsibility[]) => void;
  readonly error?: string | null;
}

/** Checkbox group for the permissions a caregiver gets in the network. */
export function ResponsibilityPicker({ legend, value, onChange, error }: ResponsibilityPickerProps) {
  const toggle = (item: Responsibility) =>
    onChange(value.includes(item) ? value.filter((v) => v !== item) : [...value, item]);

  return (
    <fieldset aria-describedby={error ? 'responsibilities-error' : undefined}>
      <legend className="mb-2 text-sm font-semibold text-alivia-primary-dark">
        {legend}
        <span aria-hidden="true" className="ml-0.5 text-alivia-danger">
          *
        </span>
      </legend>
      <div className="flex flex-col">
        {RESPONSIBILITIES.map((item) => (
          <label
            key={item}
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-1 text-sm text-alivia-text hover:bg-alivia-page"
          >
            <input
              type="checkbox"
              checked={value.includes(item)}
              onChange={() => toggle(item)}
              className="size-[18px] cursor-pointer rounded accent-alivia-primary"
            />
            {RESPONSIBILITY_LABELS[item]}
          </label>
        ))}
      </div>
      {error && (
        <p id="responsibilities-error" className="mt-1 text-xs font-semibold text-alivia-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
