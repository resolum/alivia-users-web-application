import { sortAgendaItems } from '../home.dates.ts';
import type { HomeAgendaItem } from '../home.view-model.ts';
import { useTranslations } from '../../../i18n/index.ts';
import { ActivityTimelineItem } from './ActivityTimelineItem.tsx';

interface ActivityTimelineProps {
  readonly items: readonly HomeAgendaItem[];
}

/** Ordered, semantic timeline for today's activities. */
export function ActivityTimeline({ items }: ActivityTimelineProps) {
  const t = useTranslations();
  if (items.length === 0) return null;
  const orderedItems = sortAgendaItems(items);

  return (
    <ol aria-label={t.home.panel.agendaLabel} className="mt-4">
      {orderedItems.map((item, index) => (
        <ActivityTimelineItem
          key={item.assignmentId}
          item={item}
          isLast={index === orderedItems.length - 1}
        />
      ))}
    </ol>
  );
}
