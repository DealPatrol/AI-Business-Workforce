'use client';

import { useMemo, useState } from 'react';
import styles from './fpg.module.css';
import { SCHEMA_TYPES, buildBusinessFacts, type BusinessFactsInput } from '@/lib/fpg/business-facts';

const START: BusinessFactsInput = {
  name: '',
  schemaType: 'HVACBusiness',
  website: '',
  phone: '',
  street: '',
  city: '',
  state: 'AL',
  zip: '',
  towns: '',
  services: '',
  hours: '',
  founded: '',
  license: '',
  profiles: '',
};

const TEXT_FIELDS: Array<{ key: keyof BusinessFactsInput; label: string; placeholder: string; long?: boolean }> = [
  { key: 'name', label: 'Business name (exactly as on your Google profile)', placeholder: 'Porchlight Heating & Air' },
  { key: 'website', label: 'Website', placeholder: 'porchlightair.com' },
  { key: 'phone', label: 'Main phone', placeholder: '(256) 555-0100' },
  { key: 'street', label: 'Street address (leave blank if you hide it on Google)', placeholder: '' },
  { key: 'city', label: 'City', placeholder: 'Cullman' },
  { key: 'state', label: 'State', placeholder: 'AL' },
  { key: 'zip', label: 'ZIP', placeholder: '' },
  { key: 'towns', label: 'Towns you serve (comma or one per line)', placeholder: 'Cullman, Hanceville, Good Hope, Vinemont', long: true },
  { key: 'services', label: 'Main services (comma or one per line)', placeholder: 'AC repair, furnace repair, heat pump installs', long: true },
  { key: 'hours', label: 'Hours', placeholder: 'Mon–Fri 7 AM–5 PM' },
  { key: 'founded', label: 'Year founded (optional)', placeholder: '' },
  { key: 'license', label: 'License (optional, as it appears on the state record)', placeholder: '' },
  { key: 'profiles', label: 'Profile links (Google, Facebook, BBB…), one per line', placeholder: 'https://www.facebook.com/yourshop', long: true },
];

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={styles.secondary}
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1800);
        });
      }}
    >
      {done ? 'Copied' : label}
    </button>
  );
}

export function BusinessFactsGenerator() {
  const [input, setInput] = useState<BusinessFactsInput>(START);
  const out = useMemo(() => buildBusinessFacts(input), [input]);
  const set = (key: keyof BusinessFactsInput, value: string) => setInput((prev) => ({ ...prev, [key]: value }));

  return (
    <div className={styles.calc} style={{ maxWidth: 820 }}>
      <label>
        Type of business
        <select value={input.schemaType} onChange={(e) => set('schemaType', e.target.value)}>
          {SCHEMA_TYPES.map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      {TEXT_FIELDS.map((f) => (
        <label key={f.key}>
          {f.label}
          {f.long ? (
            <textarea rows={2} placeholder={f.placeholder} value={input[f.key]} onChange={(e) => set(f.key, e.target.value)} style={{ border: '1px solid #D6DDD7', borderRadius: 10, padding: 10, fontSize: 16 }} />
          ) : (
            <input placeholder={f.placeholder} value={input[f.key]} onChange={(e) => set(f.key, e.target.value)} />
          )}
        </label>
      ))}

      <h3>1. Your business in brief (put this in visible text on your home or About page)</h3>
      <div className={styles.result} aria-live="polite">
        {out.brief}
      </div>
      <div>
        <Copy text={out.brief} label="Copy the paragraph" />
      </div>

      <h3>2. LocalBusiness schema (JSON-LD)</h3>
      <pre className={styles.formula} style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', background: '#F6F5F0', padding: 12, borderRadius: 10 }}>
        {out.jsonLdText}
      </pre>
      <div>
        <Copy text={out.jsonLdText} label="Copy the JSON-LD" />
      </div>

      <h3>3. Starter llms.txt (optional)</h3>
      <pre className={styles.formula} style={{ whiteSpace: 'pre-wrap', overflowX: 'auto', background: '#F6F5F0', padding: 12, borderRadius: 10 }}>
        {out.llms}
      </pre>
      <div>
        <Copy text={out.llms} label="Copy llms.txt" />
      </div>
      <p className={styles.fine}>Runs in your browser. Nothing you type is sent. Replace any [bracketed] placeholder before you publish.</p>
    </div>
  );
}
