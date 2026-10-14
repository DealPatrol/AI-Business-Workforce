'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import {
  POSTCARD_CTA,
  POSTCARD_MAX_QUANTITY,
  POSTCARD_MIN_QUANTITY,
  POSTCARD_PACKAGE_QUANTITIES,
  POSTCARD_SETUP_LABEL,
  POSTCARD_SIZES,
  POSTCARD_SIZE_KEYS,
  formatPostcardMoney,
  postcardCheckoutHref,
  postcardOrderCents,
  postcardPackageRows,
  type PostcardSize,
} from '@/lib/postcards/pricing';
import { normalizePostcardEmail } from '@/lib/postcards/setup-fee';
import styles from './home.module.css';

const packageRows = postcardPackageRows();

export function PostcardPackagePicker() {
  const [size, setSize] = useState<PostcardSize>('4x6');
  const [quantity, setQuantity] = useState<number>(POSTCARD_MIN_QUANTITY);
  const [customText, setCustomText] = useState(String(POSTCARD_MIN_QUANTITY));
  const [usingCustom, setUsingCustom] = useState(false);
  const [email, setEmail] = useState('');
  const [setupPaid, setSetupPaid] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(false);

  const normalizedEmail = normalizePostcardEmail(email);

  useEffect(() => {
    let active = true;
    setSetupPaid(false);
    if (!normalizedEmail) {
      setCheckingSetup(false);
      return () => {
        active = false;
      };
    }
    setCheckingSetup(true);
    const timer = setTimeout(() => {
      fetch(`/api/postcards/setup-status?email=${encodeURIComponent(normalizedEmail)}`)
        .then((response) => response.json())
        .then((data: { setupPaid?: boolean }) => {
          if (active) setSetupPaid(Boolean(data.setupPaid));
        })
        .catch(() => {
          if (active) setSetupPaid(false);
        })
        .finally(() => {
          if (active) setCheckingSetup(false);
        });
    }, 350);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [normalizedEmail]);

  const customQuantity = Number(customText);
  const customValid =
    /^\d+$/.test(customText.trim()) &&
    Number.isInteger(customQuantity) &&
    customQuantity >= POSTCARD_MIN_QUANTITY &&
    customQuantity <= POSTCARD_MAX_QUANTITY;
  const orderQuantity = usingCustom ? (customValid ? customQuantity : null) : quantity;
  const includeSetup = !setupPaid;
  const order =
    orderQuantity == null ? null : postcardOrderCents(size, orderQuantity, { includeSetup });
  const card = POSTCARD_SIZES[size];

  return (
    <div className={styles.packageBoard} id="packages">
      <div className={styles.packageIntro}>
        <p>
          <strong>{POSTCARD_SETUP_LABEL} setup</strong>, charged once per customer. Then{' '}
          {POSTCARD_SIZES['4x6'].unitLabel} per 4×6 card or {POSTCARD_SIZES['6x9'].unitLabel} per 6×9 card.
          Postage, printing, and mailing are included.
        </p>
      </div>

      <table className={styles.packageTable}>
        <caption>
          First-order totals include the {POSTCARD_SETUP_LABEL} setup fee. It is left off after that email has paid it.
        </caption>
        <thead>
          <tr>
            <th>Cards</th>
            <th>4×6 at {POSTCARD_SIZES['4x6'].unitLabel}</th>
            <th>6×9 at {POSTCARD_SIZES['6x9'].unitLabel}</th>
          </tr>
        </thead>
        <tbody>
          {packageRows.map((row) => (
            <tr key={row.quantity}>
              <th scope="row">{row.quantity.toLocaleString('en-US')}</th>
              <td>{row.fourBySixLabel}</td>
              <td>{row.sixByNineLabel}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Custom</th>
            <td colSpan={2}>Minimum {POSTCARD_MIN_QUANTITY} cards, priced as you type</td>
          </tr>
        </tbody>
      </table>

      <div className={styles.orderPanel}>
        <fieldset className={styles.sizeToggle}>
          <legend>Card size</legend>
          {POSTCARD_SIZE_KEYS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={size === option}
              onClick={() => setSize(option)}
            >
              {POSTCARD_SIZES[option].label}
              <small>{POSTCARD_SIZES[option].unitLabel}/card</small>
            </button>
          ))}
        </fieldset>

        <div className={styles.qtyChoices} role="group" aria-label="Package quantity">
          {POSTCARD_PACKAGE_QUANTITIES.map((option) => {
            const total = postcardOrderCents(size, option, { includeSetup }).totalCents;
            const selected = !usingCustom && quantity === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setUsingCustom(false);
                  setQuantity(option);
                  setCustomText(String(option));
                }}
              >
                <b>{option.toLocaleString('en-US')} cards</b>
                <span>{formatPostcardMoney(total)}</span>
              </button>
            );
          })}
        </div>

        <label className={styles.customQty}>
          Custom quantity
          <input
            type="number"
            inputMode="numeric"
            min={POSTCARD_MIN_QUANTITY}
            max={POSTCARD_MAX_QUANTITY}
            step={1}
            value={customText}
            aria-invalid={usingCustom && !customValid}
            onChange={(event) => {
              setUsingCustom(true);
              setCustomText(event.target.value);
            }}
          />
        </label>
        {usingCustom && !customValid ? (
          <p className={styles.fieldError} role="alert">
            Enter a whole number from {POSTCARD_MIN_QUANTITY.toLocaleString('en-US')} to{' '}
            {POSTCARD_MAX_QUANTITY.toLocaleString('en-US')} cards.
          </p>
        ) : null}

        <label className={styles.customQty}>
          Email
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            placeholder="Email from your first order"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <p className={styles.setupNote}>
          Use the same email as your first postcard order. We charge the {POSTCARD_SETUP_LABEL} setup fee only once.
        </p>
        {setupPaid ? (
          <p className={styles.setupPaid} role="status">
            Setup already paid.
          </p>
        ) : checkingSetup ? (
          <p className={styles.setupNote} role="status">
            Checking this email…
          </p>
        ) : null}

        {order && orderQuantity != null ? (
          <p className={styles.liveTotal}>
            <span>
              {setupPaid
                ? `Setup already paid. ${orderQuantity.toLocaleString('en-US')} × ${card.unitLabel}`
                : `${POSTCARD_SETUP_LABEL} setup + ${orderQuantity.toLocaleString('en-US')} × ${card.unitLabel}`}
            </span>
            <strong>{formatPostcardMoney(order.totalCents)}</strong>
          </p>
        ) : (
          <p className={styles.liveTotal}>
            <span>Total updates when the quantity is valid</span>
          </p>
        )}

        <ul className={styles.orderIncludes}>
          <li>
            <Check size={16} /> {setupPaid ? 'Setup already paid' : 'Setup fee is charged once per customer'}
          </li>
          <li>
            <Check size={16} /> AI designs the card
          </li>
          <li>
            <Check size={16} /> Printed and mailed directly to the homeowners
          </li>
        </ul>

        {order && orderQuantity != null ? (
          <a
            className={styles.primaryButton}
            href={postcardCheckoutHref({
              size,
              quantity: orderQuantity,
              cancelPath: '/postcards#packages',
              email: normalizedEmail,
            })}
          >
            {POSTCARD_CTA}: {orderQuantity.toLocaleString('en-US')} {card.label} — {formatPostcardMoney(order.totalCents)}{' '}
            <ArrowRight size={18} />
          </a>
        ) : (
          <span className={`${styles.primaryButton} ${styles.buttonDisabled}`}>Choose a quantity to continue</span>
        )}
      </div>
    </div>
  );
}
