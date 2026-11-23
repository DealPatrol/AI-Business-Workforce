'use client';

import { useState } from 'react';
import { CARRIERS } from '@/lib/er/tools';
import styles from '../er-site.module.css';

function digits(value: string) {
  const d = value.replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d.slice(0, 10);
}

export function ForwardingCodes() {
  const [carrier, setCarrier] = useState(CARRIERS[0].carrier);
  const [raw, setRaw] = useState('');
  const n = digits(raw);
  const shown = n.length === 10 ? n : '[10-digit number]';
  const c = CARRIERS.find((x) => x.carrier === carrier) || CARRIERS[0];
  return (
    <div className={styles.tool}>
      <div className={styles.fields}>
        <label className={styles.field}>
          Your carrier
          <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
            {CARRIERS.map((x) => (
              <option key={x.carrier} value={x.carrier}>
                {x.carrier}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Number to forward calls to
          <input inputMode="tel" placeholder="(555) 555-5555" value={raw} onChange={(e) => setRaw(e.target.value)} />
        </label>
      </div>
      <p className={styles.note}>{c.note}</p>
      {c.codes.length ? (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Forward</th>
                <th scope="col">Dial to turn on</th>
                <th scope="col">Dial to turn off</th>
              </tr>
            </thead>
            <tbody>
              {c.codes.map((code) => (
                <tr key={code.what}>
                  <td>{code.what}</td>
                  <td>
                    <span className={styles.code}>{code.on(shown)}</span>
                  </td>
                  <td>
                    <span className={styles.code}>{code.off}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {c.steps ? (
        <ol className={styles.list}>
          {c.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      ) : null}
      <p className={styles.note}>
        Source: <a href={c.sourceUrl} rel="noreferrer">{c.sourceLabel}</a>. Carriers change codes; their page is the final word. Test by
        calling your number from another phone.
      </p>
    </div>
  );
}
