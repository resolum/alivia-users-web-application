import { useId, type ChangeEvent } from 'react';
import { Icon } from '@/shared/presentation/components/navigator/Icon.tsx';
import {
  formatPersonName,
  type HomeAssistedPerson,
} from '../home.view-model.ts';
import { useTranslations } from '../../../i18n/index.ts';

interface AssistedPersonSelectorProps {
  readonly persons: readonly HomeAssistedPerson[];
  readonly selectedId: number | null;
  readonly onSelect: (id: number) => void;
}

/** Accessible selector shown only when more than one person is registered. */
export function AssistedPersonSelector({
  persons,
  selectedId,
  onSelect,
}: AssistedPersonSelectorProps) {
  const t = useTranslations();
  const selectId = useId();

  if (persons.length < 2) return null;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onSelect(Number(event.target.value));
  };

  return (
    <div className="relative">
      <label htmlFor={selectId} className="sr-only">
        {t.home.panel.selectorLabel}
      </label>
      <select
        id={selectId}
        value={selectedId ?? persons[0]?.id ?? ''}
        onChange={handleChange}
        className={[
          'min-h-11 w-full appearance-none rounded-lg border border-alivia-primary-mist',
          'bg-white py-2 pl-3 pr-9 text-sm font-semibold text-alivia-text',
        ].join(' ')}
      >
        {persons.map((person) => (
          <option key={person.id} value={person.id}>
            {formatPersonName(person.name)}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-alivia-text-soft"
      />
    </div>
  );
}
