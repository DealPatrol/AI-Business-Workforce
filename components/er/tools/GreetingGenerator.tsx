'use client';

import { useState } from 'react';
import styles from '../er-site.module.css';

export function GreetingGenerator() {
  const [shop, setShop] = useState('');
  const [hours, setHours] = useState('Monday to Friday, 7 AM to 5 PM');
  const [callback, setCallback] = useState('the next business morning');
  const [urgent, setUrgent] = useState('If this is an emergency, say “emergency” in your message and include your address.');
  const [safety, setSafety] = useState(true);
  const name = shop.trim() || '[Shop name]';
  const text = [
    `Thanks for calling ${name}. Our office is closed right now. Our hours are ${hours.trim() || '[your hours]'}.`,
    'Please leave your name, your callback number, your address, and what you need.',
    urgent.trim(),
    `We return messages ${callback.trim() || '[when you call back]'}.`,
    safety ? 'If you smell gas or anyone is in danger, hang up and call 911.' : '',
    'Thanks for calling.',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={styles.tool}>
      <div className={styles.fields}>
        <label className={styles.field}>
          Shop name
          <input value={shop} placeholder="Porchlight Heating & Air" onChange={(e) => setShop(e.target.value)} />
        </label>
        <label className={styles.field}>
          Office hours
          <input value={hours} onChange={(e) => setHours(e.target.value)} />
        </label>
        <label className={styles.field}>
          When you call back
          <input value={callback} onChange={(e) => setCallback(e.target.value)} />
        </label>
        <label className={styles.field}>
          Emergency line
          <input value={urgent} onChange={(e) => setUrgent(e.target.value)} />
        </label>
      </div>
      <label className={styles.fine}>
        <input type="checkbox" checked={safety} onChange={(e) => setSafety(e.target.checked)} /> Add a gas and safety line
      </label>
      <h3>Your greeting</h3>
      <p className={styles.output}>{text}</p>
      <p className={styles.note}>Read it out loud once before you record it. Keep it under 30 seconds.</p>
    </div>
  );
}
