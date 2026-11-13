import { useId } from 'react';

// Seal outline with a wavy (scalloped) edge: `n` bumps between radii 88 and 96.
const scallop = (n = 16) => {
  const pts = [];
  for (let i = 0; i <= 360; i += 3) {
    const a = (i * Math.PI) / 180, r = 92 + 4 * Math.cos(n * a);
    pts.push(`${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};
const SEAL = scallop();
const star = (cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
};
const STARS = [star(72, 58, 7), star(100, 48, 10), star(128, 58, 7), star(72, 142, 7), star(100, 152, 10), star(128, 142, 7)].join('');

/** Seal-style badge: scalloped disc in the brand colours with a ribbon across it carrying one word. */
export default function Stamp({ word = 'FREE', className = '' }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`stamp ${className}`} viewBox="-12 -12 224 224" role="img" aria-label={word}>
      <defs>
        <linearGradient id={`seal-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b3262a" /><stop offset="1" stopColor="#6e0b0d" />
        </linearGradient>
        <linearGradient id={`band-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8e1b1e" /><stop offset="1" stopColor="#4e0405" />
        </linearGradient>
      </defs>
      <path d={SEAL} fill={`url(#seal-${id})`} />
      <circle cx="100" cy="100" r="78" className="stamp-ring" />
      <path d={STARS} className="stamp-star" />
      <g transform="rotate(-10 100 100)">
        <path d="M-6,72 H206 L196,100 L206,128 H-6 L4,100 Z" fill={`url(#band-${id})`} className="stamp-band" />
        <path d="M2,79 H198 L190,100 L198,121 H2 L10,100 Z" className="stamp-band-line" />
        <text x="100" y="101" className="stamp-word" textAnchor="middle" dominantBaseline="central">{word}</text>
      </g>
    </svg>
  );
}
