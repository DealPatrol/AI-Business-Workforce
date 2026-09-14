'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Mail, MapPin, ShoppingBag } from 'lucide-react';

type TierKey = 'clean' | 'upgraded' | 'premium';
type Material = readonly [name: string, quantity: number, unitPrice: number];

const tiers: Record<TierKey, { label: string; description: string; items: readonly Material[] }> = {
  clean: {
    label: 'Clean & Simple',
    description: 'Standard / realistic',
    items: [
      ['Dwarf Boxwood', 7, 34.98],
      ['Hydrangea', 4, 36.98],
      ['Seasonal Color', 8, 9.98],
      ['Black Mulch', 16, 4.98],
      ['Landscape Edging', 65, 1.42],
    ],
  },
  upgraded: {
    label: 'Upgraded',
    description: 'More curb appeal',
    items: [
      ['Dwarf Boxwood', 9, 34.98],
      ['Hydrangea', 6, 36.98],
      ['Perennial Color', 14, 12.98],
      ['Black Mulch', 24, 4.98],
      ['Stone Edging', 75, 4.85],
    ],
  },
  premium: {
    label: 'Premium',
    description: 'High-end transformation',
    items: [
      ['Premium Shrub', 12, 44.98],
      ['Hydrangea', 8, 36.98],
      ['Feature Plants', 5, 59.98],
      ['Decorative Stone', 30, 10.98],
      ['Natural Stone Border', 90, 7.25],
    ],
  },
};

function normalizeZip(value: string | undefined) {
  const zip = value?.replace(/\D/g, '').slice(0, 5);
  return zip || '35077';
}

function PropertyDemoContent() {
  const searchParams = useSearchParams();
  const [tier, setTier] = useState<TierKey>('clean');
  const [margin, setMargin] = useState(40);
  const [labor, setLabor] = useState(1100);
  const [zip, setZip] = useState(() => normalizeZip(searchParams.get('zip') ?? undefined));
  const design = tiers[tier];
  const materials = useMemo(
    () => design.items.reduce((sum, [, quantity, unitPrice]) => sum + quantity * unitPrice, 0),
    [design],
  );
  const direct = materials + labor + 225;
  const sell = direct / (1 - margin / 100);

  return (
    <main className="studio">
      <header>
        <Link href="/">
          <ArrowLeft /> YardProof
        </Link>
        <b>Property Transformation Studio</b>
        <Link href="/visual-canvasser">
          Campaign offer <ArrowRight />
        </Link>
      </header>
      <div className="studiowrap">
        <div className="studiohead">
          <span>INTERACTIVE PRODUCT DEMO</span>
          <h1>Turn a property into a priced sales opportunity.</h1>
          <p>
            Choose a design level, inspect a demo material takeoff, and apply the contractor&apos;s
            own profit rules.
          </p>
        </div>
        <div className="steps">
          <span className="active">1 Property</span>
          <span className="active">2 Design</span>
          <span className="active">3 Materials</span>
          <span className="active">4 Price</span>
          <span>5 Outreach</span>
        </div>
        <div className="propertygrid">
          <section className="visual">
            <div className="visualtop">
              <span>
                <MapPin /> Demo property · ZIP
                <input
                  aria-label="Demo property ZIP code"
                  inputMode="numeric"
                  value={zip}
                  onChange={(event) => setZip(event.target.value.replace(/\D/g, '').slice(0, 5))}
                />
              </span>
              <small>ILLUSTRATIVE CONCEPT</small>
            </div>
            <div className={`yard ${tier}`}>
              <Image
                src="/service-landscaping.png"
                alt="Illustrative landscaped front-yard concept"
                fill
                priority
                sizes="(max-width: 800px) 100vw, 52vw"
              />
              <span>DEMO CONCEPT · {design.label.toUpperCase()}</span>
            </div>
            <p className="demo-image-note">
              Example creative, not a live address render. Campaign imagery is sourced and reviewed
              with the customer.
            </p>
            <div className="tierbuttons">
              {(Object.entries(tiers) as [TierKey, (typeof tiers)[TierKey]][]).map(
                ([key, option]) => (
                  <button
                    type="button"
                    className={tier === key ? 'selected' : ''}
                    onClick={() => setTier(key)}
                    key={key}
                  >
                    <b>{option.label}</b>
                    <small>{option.description}</small>
                  </button>
                ),
              )}
            </div>
            <div className="supplier">
              <ShoppingBag />
              <div>
                <b>Supplier catalog</b>
                <p>Preferred supplier connector</p>
              </div>
              <em>INTEGRATION REQUIRED</em>
            </div>
          </section>
          <section className="takeoff">
            <div className="takehead">
              <div>
                <small>MATERIAL TAKEOFF</small>
                <h2>{design.label} design</h2>
              </div>
              <span>DEMO PRICES</span>
            </div>
            {design.items.map(([name, quantity, unitPrice]) => (
              <div className="material" key={name}>
                <div>
                  <b>{name}</b>
                  <small>
                    {quantity} × ${unitPrice.toFixed(2)}
                  </small>
                </div>
                <strong>${(quantity * unitPrice).toFixed(2)}</strong>
                <span>Example</span>
              </div>
            ))}
            <div className="pricing">
              <label>
                Labor estimate
                <div>
                  ${' '}
                  <input
                    aria-label="Labor estimate"
                    type="number"
                    min="0"
                    value={labor}
                    onChange={(event) => setLabor(Number(event.target.value))}
                  />
                </div>
              </label>
              <label>
                Target gross margin
                <div>
                  <input
                    aria-label="Target gross margin"
                    type="range"
                    min="10"
                    max="70"
                    value={margin}
                    onChange={(event) => setMargin(Number(event.target.value))}
                  />
                  <b>{margin}%</b>
                </div>
              </label>
              <p>
                <span>Materials</span>
                <b>${materials.toFixed(0)}</b>
              </p>
              <p>
                <span>Labor + other costs</span>
                <b>${(labor + 225).toFixed(0)}</b>
              </p>
              <p>
                <span>Estimated direct cost</span>
                <b>${direct.toFixed(0)}</b>
              </p>
              <p className="sell">
                <span>Recommended selling price</span>
                <b>${sell.toFixed(0)}</b>
              </p>
              <small>
                Direct cost ÷ (1 − gross margin). The contractor controls final pricing.
              </small>
            </div>
            <Link className="button full" href={`/property-demo/postcard?zip=${normalizeZip(zip)}`}>
              <Mail /> Preview Personalized Postcard <ArrowRight />
            </Link>
          </section>
        </div>
        <div className="guardrail">
          <Check />
          <p>
            <b>Production guardrail:</b> Images, store-specific products, prices, and availability
            are only labeled live when authorized sources are connected. This demo uses clearly
            labeled example creative and pricing.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function PropertyDemo() {
  return (
    <Suspense fallback={<main className="studio" aria-busy="true" />}>
      <PropertyDemoContent />
    </Suspense>
  );
}
