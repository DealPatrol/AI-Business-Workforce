'use client';

import styles from './schedule.module.css';

export type PickerSlot = { start: string; label: string; localDate: string };

/** Open windows grouped by day. */
export function SlotPicker({ slots, value, onChange }: { slots: PickerSlot[]; value: string; onChange: (start: string) => void }) {
  const days = new Map<string, PickerSlot[]>();
  for (const s of slots) days.set(s.localDate, [...(days.get(s.localDate) || []), s]);
  if (!slots.length) return <p className={styles.err}>No open times right now. Please call the business.</p>;
  return (
    <div className={styles.days}>
      {[...days.entries()].map(([date, list]) => (
        <div key={date} className={styles.day}>
          <h2>{list[0].label.split(',').slice(0, 2).join(',')}</h2>
          <div className={styles.slots}>
            {list.map((s) => (
              <button
                key={s.start}
                type="button"
                className={value === s.start ? styles.slotOn : styles.slot}
                aria-pressed={value === s.start}
                onClick={() => onChange(s.start)}
              >
                {s.label.split(',').slice(2).join(',').trim()}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
