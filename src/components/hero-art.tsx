/**
 * Grafisk hero-bakgrund: en abstrakt bilsilhuett med lackreflexer och
 * vattenpärlor. Ritas helt i SVG – inga stockfoton, laddar direkt.
 * Ersätts automatiskt av ett riktigt foto när `site.heroImage` är satt.
 */

// Deterministiska "vattenpärlor" (samma resultat vid varje rendering).
function beads() {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: 70 }, () => {
    const x = 560 + rand() * 640;
    const y = 40 + rand() * 360;
    const r = 1.5 + rand() * rand() * 9;
    return { x, y, r, o: 0.25 + rand() * 0.55 };
  });
}

const BEADS = beads();

export function HeroArt() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="h-glow" cx="70%" cy="40%" r="60%">
          <stop offset="0" stopColor="#3a3c42" />
          <stop offset="0.45" stopColor="#16171a" />
          <stop offset="1" stopColor="#08090a" />
        </radialGradient>
        <linearGradient id="h-band" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="h-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2b30" />
          <stop offset="0.55" stopColor="#111214" />
          <stop offset="1" stopColor="#0a0a0c" />
        </linearGradient>
        <linearGradient id="h-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.1" />
        </linearGradient>
        <radialGradient id="h-bead" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#c9ccd2" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id="h-floor" cx="50%" cy="0%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.12" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="h-blur" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="h-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>

      <rect width="1200" height="800" fill="url(#h-glow)" />

      {/* Ljusreflex som långsamt glider över "lacken". */}
      <g className="sheen">
        <path d="M-100 330 C 300 230, 700 210, 1300 300" stroke="url(#h-band)" strokeWidth="70" fill="none" filter="url(#h-blur)" opacity="0.35" />
      </g>

      {/* Bilsilhuett. */}
      <g transform="translate(400 360) scale(0.82)">
        <ellipse cx="500" cy="262" rx="520" ry="34" fill="url(#h-floor)" />
        <path
          d="M40 228 C 36 205, 40 186, 52 176 C 90 164, 150 156, 240 150 C 300 128, 360 96, 420 84 C 480 74, 560 72, 610 80 C 660 92, 710 122, 760 146 C 840 154, 905 166, 945 182 C 962 192, 968 210, 964 228 L 850 232 A 82 82 0 0 0 690 232 L 312 232 A 82 82 0 0 0 152 232 Z"
          fill="url(#h-body)"
        />
        {/* Kantlinje / glans längs karossen. */}
        <path
          d="M52 176 C 90 164, 150 156, 240 150 C 300 128, 360 96, 420 84 C 480 74, 560 72, 610 80 C 660 92, 710 122, 760 146 C 840 154, 905 166, 945 182"
          stroke="url(#h-edge)"
          strokeWidth="2"
          fill="none"
        />
        {/* Sidolinje. */}
        <path d="M120 190 C 400 178, 700 178, 930 196" stroke="#fff" strokeOpacity="0.18" strokeWidth="1.5" fill="none" />
        {/* Rutor. */}
        <path
          d="M300 146 C 350 120, 400 98, 440 94 L 600 92 C 640 100, 680 120, 712 142 Z"
          fill="#000"
          fillOpacity="0.55"
          stroke="#fff"
          strokeOpacity="0.12"
        />
        <path d="M520 93 L 512 145" stroke="#fff" strokeOpacity="0.1" strokeWidth="5" />
        {/* Hjul. */}
        {[232, 770].map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy="232" r="64" fill="#050506" />
            <circle cx={cx} cy="232" r="44" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="2" />
            <circle cx={cx} cy="232" r="38" fill="#121316" />
            {Array.from({ length: 5 }, (_, i) => {
              const a = (i * 2 * Math.PI) / 5;
              return (
                <line
                  key={i}
                  x1={cx}
                  y1={232}
                  x2={cx + Math.cos(a) * 36}
                  y2={232 + Math.sin(a) * 36}
                  stroke="#fff"
                  strokeOpacity="0.28"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              );
            })}
            <circle cx={cx} cy="232" r="7" fill="#2c2d32" />
          </g>
        ))}
        {/* Strålkastare och baklykta. */}
        <path d="M915 176 C 935 180, 950 186, 956 194 L 925 192 Z" fill="#fff" fillOpacity="0.85" filter="url(#h-soft)" />
        <path d="M46 180 L 70 176 L 66 192 L 44 194 Z" fill="#e5484d" fillOpacity="0.7" filter="url(#h-soft)" />
      </g>

      {/* Vattenpärlor. */}
      <g opacity="0.55">
        {BEADS.map((b, i) => (
          <circle key={i} cx={b.x.toFixed(1)} cy={b.y.toFixed(1)} r={b.r.toFixed(2)} fill="url(#h-bead)" opacity={b.o.toFixed(2)} />
        ))}
      </g>
    </svg>
  );
}
