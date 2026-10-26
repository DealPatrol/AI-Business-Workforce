'use client';

import { useEffect, useRef } from 'react';

export type AvatarMouth = { open: number; wide: number };

type Props = {
  /** Called every animation frame; return mouth shape 0..1 from the agent's audio. */
  sample: () => AvatarMouth;
  state: 'idle' | 'connecting' | 'listening' | 'speaking';
};

/**
 * Original illustrated receptionist ("Avery"). Drawn in-repo as SVG, so there are no
 * likeness or asset-licensing concerns. Mouth, jaw, brows, blinks and head motion are
 * animated from the agent's output audio with requestAnimationFrame (no React re-renders).
 */
export function LiveAvatar({ sample, state }: Props) {
  const head = useRef<SVGGElement>(null);
  const mouth = useRef<SVGPathElement>(null);
  const teeth = useRef<SVGPathElement>(null);
  const jaw = useRef<SVGGElement>(null);
  const lids = useRef<SVGGElement>(null);
  const brows = useRef<SVGGElement>(null);
  const body = useRef<SVGGElement>(null);
  const sampleRef = useRef(sample);
  sampleRef.current = sample;
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let raf = 0;
    let open = 0;
    let wide = 0.5;
    let nextBlink = performance.now() + 1800;
    let blinkStart = -1;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const tick = (t: number) => {
      const s = sampleRef.current();
      // Fast attack, slower release reads as natural speech.
      const k = s.open > open ? 0.55 : 0.22;
      open += (s.open - open) * k;
      wide += (s.wide - wide) * 0.2;

      const o = Math.min(1, open);
      const w = 0.85 + wide * 0.3;
      const halfW = 17 * w;
      const top = 0 - o * 2;
      const bottom = 2 + o * 15;
      mouth.current?.setAttribute(
        'd',
        `M ${-halfW} 0 Q 0 ${top - 3} ${halfW} 0 Q ${halfW * 0.6} ${bottom} 0 ${bottom} Q ${-halfW * 0.6} ${bottom} ${-halfW} 0 Z`,
      );
      teeth.current?.setAttribute(
        'd',
        `M ${-halfW * 0.7} ${0.6} Q 0 ${top - 1.5} ${halfW * 0.7} 0.6 L ${halfW * 0.6} ${2 + o * 3} Q 0 ${3 + o * 3} ${-halfW * 0.6} ${2 + o * 3} Z`,
      );
      teeth.current?.setAttribute('opacity', o > 0.12 ? '1' : '0');
      jaw.current?.setAttribute('transform', `translate(0 ${o * 5})`);

      // Blink
      if (t > nextBlink && blinkStart < 0) blinkStart = t;
      let lid = 0;
      if (blinkStart >= 0) {
        const p = (t - blinkStart) / 160;
        lid = p < 0.5 ? p * 2 : Math.max(0, 2 - p * 2);
        if (p >= 1) {
          blinkStart = -1;
          nextBlink = t + 2200 + Math.random() * 3200;
        }
      }
      lids.current?.setAttribute('transform', `scale(1 ${Math.max(0.02, lid)})`);

      const st = stateRef.current;
      const motion = reduce ? 0 : 1;
      const sway = Math.sin(t / 1400) * 1.6 + (st === 'speaking' ? Math.sin(t / 330) * o * 2.2 : 0);
      const nod = Math.sin(t / 1900) * 1.2 + (st === 'listening' ? Math.sin(t / 900) * 0.8 : 0);
      head.current?.setAttribute(
        'transform',
        `translate(${sway * 0.6 * motion} ${nod * motion}) rotate(${sway * 0.7 * motion} 200 230)`,
      );
      brows.current?.setAttribute('transform', `translate(0 ${-(o * 3 + (st === 'listening' ? 1.5 : 0))})`);
      body.current?.setAttribute('transform', `translate(0 ${Math.sin(t / 1700) * 1.4 * motion})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg viewBox="0 0 400 440" role="img" aria-label="Animated AI receptionist" width="100%" height="100%">
      <defs>
        <radialGradient id="la-bg" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#f4ead9" />
          <stop offset="100%" stopColor="#c9b79a" />
        </radialGradient>
        <linearGradient id="la-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7b894" />
          <stop offset="100%" stopColor="#cf9a74" />
        </linearGradient>
        <linearGradient id="la-hair" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4a2f22" />
          <stop offset="100%" stopColor="#2a1912" />
        </linearGradient>
        <linearGradient id="la-blazer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#24384a" />
          <stop offset="100%" stopColor="#15222e" />
        </linearGradient>
        <clipPath id="la-mouth-clip">
          <path d="M -40 -10 H 40 V 30 H -40 Z" />
        </clipPath>
      </defs>
      <rect width="400" height="440" fill="url(#la-bg)" />
      <g ref={body}>
        {/* back hair */}
        <path d="M110 200 C 95 300, 110 360, 140 390 L 260 390 C 290 360, 305 300, 290 200 Z" fill="url(#la-hair)" />
        {/* shoulders */}
        <path d="M60 440 C 70 370, 130 340, 200 336 C 270 340, 330 370, 340 440 Z" fill="url(#la-blazer)" />
        <path d="M170 338 L200 400 L230 338 Z" fill="#f3efe8" />
        <path d="M200 400 L170 338 L150 345 L185 440 Z M200 400 L230 338 L250 345 L215 440 Z" fill="#1c2c3a" />
        {/* neck */}
        <path d="M172 285 L172 340 C 185 352, 215 352, 228 340 L228 285 Z" fill="#c98f69" />
      </g>
      <g ref={head}>
        {/* ears */}
        <ellipse cx="126" cy="225" rx="12" ry="20" fill="#d9a580" />
        <ellipse cx="274" cy="225" rx="12" ry="20" fill="#d9a580" />
        <circle cx="127" cy="246" r="3" fill="#e8c46a" />
        <circle cx="273" cy="246" r="3" fill="#e8c46a" />
        {/* face */}
        <path d="M130 200 C 130 120, 270 120, 270 200 C 270 262, 238 304, 200 306 C 162 304, 130 262, 130 200 Z" fill="url(#la-skin)" />
        {/* jaw (moves down slightly with open mouth) */}
        <g ref={jaw}>
          <path d="M158 270 C 172 296, 228 296, 242 270 C 234 300, 166 300, 158 270 Z" fill="#c48e6a" opacity="0.35" />
        </g>
        {/* cheeks */}
        <ellipse cx="160" cy="240" rx="16" ry="9" fill="#e48f7f" opacity="0.28" />
        <ellipse cx="240" cy="240" rx="16" ry="9" fill="#e48f7f" opacity="0.28" />
        {/* eyes */}
        <g>
          <ellipse cx="170" cy="210" rx="13" ry="8.5" fill="#fff" />
          <ellipse cx="230" cy="210" rx="13" ry="8.5" fill="#fff" />
          <circle cx="171" cy="210" r="6.5" fill="#5b3a26" />
          <circle cx="231" cy="210" r="6.5" fill="#5b3a26" />
          <circle cx="171" cy="210" r="3" fill="#1b100a" />
          <circle cx="231" cy="210" r="3" fill="#1b100a" />
          <circle cx="173.5" cy="207.5" r="1.8" fill="#fff" />
          <circle cx="233.5" cy="207.5" r="1.8" fill="#fff" />
          <path d="M156 207 Q170 197 184 207" stroke="#2a1912" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M216 207 Q230 197 244 207" stroke="#2a1912" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
        {/* eyelids (blink) */}
        <g transform="translate(0 201)">
          <g ref={lids}>
            <rect x="154" y="0" width="32" height="19" rx="9" fill="#d9a580" />
            <rect x="214" y="0" width="32" height="19" rx="9" fill="#d9a580" />
          </g>
        </g>
        {/* brows */}
        <g ref={brows}>
          <path d="M154 188 Q170 179 186 186" stroke="#3a241a" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M214 186 Q230 179 246 188" stroke="#3a241a" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </g>
        {/* nose */}
        <path d="M200 214 C 197 232, 192 240, 196 244 C 199 246, 203 246, 206 244" stroke="#b07856" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* mouth */}
        <g transform="translate(200 266)">
          <path ref={mouth} d="M -17 0 Q 0 -3 17 0 Q 10 2 0 2 Q -10 2 -17 0 Z" fill="#7a2f2f" stroke="#a8504a" strokeWidth="2.2" strokeLinejoin="round" />
          <path ref={teeth} d="" fill="#fbf7f2" opacity="0" />
        </g>
        {/* front hair */}
        <path d="M124 205 C 112 120, 200 92, 262 128 C 286 144, 284 182, 278 212 C 270 170, 240 150, 200 146 C 168 150, 150 168, 138 214 Z" fill="url(#la-hair)" />
        <path d="M200 140 C 230 140, 262 160, 270 196 C 258 168, 236 154, 206 152 Z" fill="#6a4433" opacity="0.6" />
      </g>
      {state === 'speaking' || state === 'listening' ? null : (
        <rect width="400" height="440" fill="#0d1620" opacity={state === 'connecting' ? 0.12 : 0.04} />
      )}
    </svg>
  );
}
