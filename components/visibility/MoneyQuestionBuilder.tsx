'use client';

import { useId, useMemo, useState } from 'react';
import styles from './visibility.module.css';

/**
 * Free money-question builder for the AI self-check guide.
 * Runs in the browser only: it fills a trade and towns into question patterns, sends nothing,
 * and lets the owner copy the list or download a blank CSV log for the runs.
 */
const TRADES: Record<string, { label: string; problem: string; job: string }> = {
  hvac: { label: 'HVAC company', problem: 'an AC that stopped cooling', job: 'a new AC unit' },
  plumbing: { label: 'plumber', problem: 'a burst pipe', job: 'a water heater replacement' },
  roofing: { label: 'roofing company', problem: 'a roof leak after a storm', job: 'a roof replacement' },
  electrical: { label: 'electrician', problem: 'a breaker that keeps tripping', job: 'an electrical panel upgrade' },
  septic: { label: 'septic company', problem: 'a septic backup', job: 'septic tank pumping' },
  pest: { label: 'pest control company', problem: 'termites', job: 'a termite treatment' },
  landscaping: { label: 'landscaper', problem: 'a yard that floods when it rains', job: 'a new lawn install' },
  'garage-door': { label: 'garage door company', problem: 'a garage door that will not open', job: 'a garage door spring repair' },
};

export function buildMoneyQuestions(tradeKey: string, towns: string[]) {
  const trade = TRADES[tradeKey] ?? TRADES.hvac;
  const places = towns.map((t) => t.trim()).filter(Boolean).slice(0, 3);
  const list = places.length ? places : ['your town'];
  const out: string[] = [];
  for (const town of list) {
    out.push(
      `Who is the best ${trade.label} in ${town}?`,
      `Can you recommend a good ${trade.label} in ${town}? Give me a short list.`,
      `Who can fix ${trade.problem} in ${town} today?`,
      `How much does ${trade.job} cost in ${town}?`,
    );
  }
  out.push(`What do you know about [your business name] in ${list[0]}?`);
  return out;
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

export function MoneyQuestionBuilder() {
  const id = useId();
  const [trade, setTrade] = useState('hvac');
  const [towns, setTowns] = useState('Cullman, AL');
  const [copied, setCopied] = useState(false);
  const questions = useMemo(() => buildMoneyQuestions(trade, towns.split(/[;\n]|\s+and\s+|\|/)), [trade, towns]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(questions.join('\n'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  function downloadLog() {
    const header = ['Date', 'Tool (ChatGPT / Perplexity / Google)', 'Question', 'Run', 'Businesses named, in order', 'Were we named?', 'Sites cited'];
    const rows = questions.flatMap((q) =>
      ['ChatGPT', 'Perplexity', 'Google'].flatMap((tool) => [1, 2].map((run) => ['', tool, q, String(run), '', '', ''])),
    );
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-answer-check-log.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={styles.form}>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label htmlFor={`${id}-trade`}>Your trade</label>
          <select
            id={`${id}-trade`}
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            style={{ minHeight: 48, padding: '11px 13px', borderRadius: 10, border: '1.5px solid #9aa79d', font: 'inherit', fontSize: 16, background: '#fff' }}
          >
            {Object.entries(TRADES).map(([key, t]) => (
              <option key={key} value={key}>
                {t.label.charAt(0).toUpperCase() + t.label.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-towns`}>Up to 3 towns (separate with ;)</label>
          <input id={`${id}-towns`} value={towns} onChange={(e) => setTowns(e.target.value)} maxLength={120} placeholder="Cullman, AL; Hanceville, AL" />
        </div>
      </div>
      <ol style={{ margin: 0, paddingLeft: 22, lineHeight: 1.7 }} aria-live="polite">
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={copy}>
          {copied ? 'Copied' : 'Copy the questions'}
        </button>
        <button type="button" className={styles.secondary} onClick={downloadLog}>
          Download a blank log (CSV)
        </button>
      </div>
      <p className={styles.formNote}>
        Runs in your browser. Nothing is sent to us or to any AI tool. Paste each question into a fresh chat yourself, twice per tool.
      </p>
    </div>
  );
}
