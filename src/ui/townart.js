// ============================================================
// HEARTHWICK — hand-drawn SVG art
// Every building is drawn from primitives in a shared 220x150 plot box,
// in a light 3/4 view: a face, a pitched roof, and some character.
// ============================================================

// Shared palette — warm and storybook, but sitting comfortably inside
// the game's dark UI.
export const ART = {
  grass1: '#2f5d3a', grass2: '#356a41', grassDark: '#264c30',
  path: '#8a7654', pathEdge: '#6f5d42',
  wood: '#7a5233', woodDark: '#5e3e26', woodLight: '#9c6a44',
  plaster: '#d9cbb0', plasterShade: '#c2b298',
  roofRed: '#a4453c', roofRedDark: '#82352e',
  roofBlue: '#3f6b8a', roofBlueDark: '#2f5169',
  roofGreen: '#4a7a52', roofGreenDark: '#3a6141',
  roofPurple: '#6a4b7d', roofPurpleDark: '#523a61',
  roofThatch: '#b99457', roofThatchDark: '#96763f',
  stone: '#8d8d93', stoneDark: '#6f6f76',
  window: '#f2d68a', windowDark: '#c9a94f',
  glow: '#ffd97a',
};

// ---------- scene furniture ----------

export function grassBackdrop() {
  return `
    <defs>
      <linearGradient id="skyGrass" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${ART.grass2}"/>
        <stop offset="100%" stop-color="${ART.grassDark}"/>
      </linearGradient>
      <pattern id="grassTuft" width="46" height="46" patternUnits="userSpaceOnUse">
        <path d="M8 34 q3 -8 6 0" stroke="${ART.grass1}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.55"/>
        <path d="M30 20 q3 -7 6 0" stroke="${ART.grass1}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity="0.4"/>
      </pattern>
      <filter id="softShadow" x="-30%" y="-30%" width="160%" height="180%">
        <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity="0.45"/>
      </filter>
    </defs>
    <rect width="960" height="620" fill="url(#skyGrass)"/>
    <rect width="960" height="620" fill="url(#grassTuft)"/>`;
}

export function paths() {
  return `
    <g opacity="0.9">
      <rect x="300" y="0"  width="46" height="620" fill="${ART.path}"/>
      <rect x="300" y="0"  width="4"  height="620" fill="${ART.pathEdge}" opacity="0.6"/>
      <rect x="342" y="0"  width="4"  height="620" fill="${ART.pathEdge}" opacity="0.6"/>
      <rect x="600" y="0"  width="46" height="620" fill="${ART.path}"/>
      <rect x="600" y="0"  width="4"  height="620" fill="${ART.pathEdge}" opacity="0.6"/>
      <rect x="642" y="0"  width="4"  height="620" fill="${ART.pathEdge}" opacity="0.6"/>
      <rect x="0" y="248" width="960" height="42" fill="${ART.path}"/>
      <rect x="0" y="248" width="960" height="4"  fill="${ART.pathEdge}" opacity="0.6"/>
      <rect x="0" y="286" width="960" height="4"  fill="${ART.pathEdge}" opacity="0.6"/>
      <rect x="0" y="432" width="960" height="42" fill="${ART.path}"/>
      <rect x="0" y="432" width="960" height="4"  fill="${ART.pathEdge}" opacity="0.6"/>
      <rect x="0" y="470" width="960" height="4"  fill="${ART.pathEdge}" opacity="0.6"/>
    </g>`;
}

export function tree(x, y, s = 1) {
  return `
    <g transform="translate(${x},${y}) scale(${s})" filter="url(#softShadow)">
      <rect x="-5" y="6" width="10" height="22" rx="3" fill="${ART.woodDark}"/>
      <circle cx="0" cy="-6" r="20" fill="#2c6136"/>
      <circle cx="-11" cy="2" r="14" fill="#357040"/>
      <circle cx="11" cy="1" r="13" fill="#2a5c33"/>
      <circle cx="2" cy="-14" r="12" fill="#3b7a47"/>
    </g>`;
}

export function lamp(x, y) {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-2" y="-2" width="4" height="26" fill="${ART.stoneDark}"/>
      <circle cx="0" cy="-8" r="7" fill="${ART.glow}" opacity="0.28"/>
      <rect x="-5" y="-13" width="10" height="12" rx="2" fill="${ART.stone}"/>
      <rect x="-3" y="-11" width="6" height="8" rx="1" fill="${ART.window}"/>
    </g>`;
}

export function signpost(x, y, label) {
  return `
    <g transform="translate(${x},${y})">
      <rect x="-2" y="0" width="4" height="26" fill="${ART.woodDark}"/>
      <rect x="-34" y="-14" width="68" height="18" rx="3" fill="${ART.wood}" stroke="${ART.woodDark}" stroke-width="2"/>
      <text x="0" y="-1" text-anchor="middle" font-size="11" font-family="Georgia, serif"
            fill="#f0e2c4" font-weight="bold">${label}</text>
    </g>`;
}

// ---------- plot states ----------

export function emptyPlot(w, h) {
  return `
    <g>
      <rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="#2b5335" opacity="0.55"
            stroke="#6f8f5f" stroke-width="2" stroke-dasharray="8 6"/>
      <g opacity="0.85">
        <rect x="${w / 2 - 26}" y="${h / 2 - 20}" width="52" height="6" rx="3" fill="${ART.wood}"/>
        <rect x="${w / 2 - 3}" y="${h / 2 - 20}" width="6" height="34" fill="${ART.woodDark}"/>
      </g>
      <text x="${w / 2}" y="${h / 2 + 32}" text-anchor="middle" font-size="13"
            font-family="Georgia, serif" fill="#cfe3c4">Empty parcel</text>
    </g>`;
}

export function lockedPlot(w, h) {
  return `
    <g opacity="0.55">
      <rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="#1d2a20" opacity="0.75"
            stroke="#40513f" stroke-width="2" stroke-dasharray="4 6"/>
      <text x="${w / 2}" y="${h / 2 + 2}" text-anchor="middle" font-size="24">🔒</text>
      <text x="${w / 2}" y="${h / 2 + 26}" text-anchor="middle" font-size="12"
            font-family="Georgia, serif" fill="#93a68f">Not for sale yet</text>
    </g>`;
}

export function forSalePlot(w, h) {
  return `
    <g>
      <rect x="0" y="0" width="${w}" height="${h}" rx="10" fill="#2b4a35" opacity="0.5"
            stroke="${ART.glow}" stroke-width="2" stroke-dasharray="10 6"/>
      <g transform="translate(${w / 2},${h / 2 - 14})">
        <rect x="-3" y="0" width="6" height="30" fill="${ART.woodDark}"/>
        <rect x="-38" y="-22" width="76" height="26" rx="3" fill="#e8dcc0" stroke="${ART.woodDark}" stroke-width="2"/>
        <text x="0" y="-4" text-anchor="middle" font-size="12" font-family="Georgia, serif"
              fill="#6b4a2a" font-weight="bold">FOR SALE</text>
      </g>
    </g>`;
}

// ---------- buildings ----------
// Each returns markup for a 220x150 box.

function base(w, h) {
  return `<ellipse cx="${w / 2}" cy="${h - 12}" rx="${w * 0.42}" ry="10" fill="#000" opacity="0.28"/>`;
}

function windowPane(x, y, w = 16, h = 16, lit = true) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"
          fill="${lit ? ART.window : '#3a3f4a'}" stroke="${ART.woodDark}" stroke-width="2"/>
    <line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" stroke="${ART.woodDark}" stroke-width="1.5"/>
    <line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" stroke="${ART.woodDark}" stroke-width="1.5"/>`;
}

function smoke(x, y) {
  return `
    <g opacity="0.5">
      <circle cx="${x}" cy="${y}" r="5" fill="#cfd6dd">
        <animate attributeName="cy" values="${y};${y - 24}" dur="4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.55;0" dur="4s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${x + 5}" cy="${y + 4}" r="4" fill="#cfd6dd">
        <animate attributeName="cy" values="${y + 4};${y - 18}" dur="4s" begin="1.4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0" dur="4s" begin="1.4s" repeatCount="indefinite"/>
      </circle>
    </g>`;
}

const BUILDING_ART = {
  lumber_yard: (w, h) => `
    ${base(w, h)}
    <g transform="translate(${w / 2 - 74},${h - 104})">
      <!-- open-sided sawmill -->
      <rect x="0" y="34" width="148" height="58" fill="${ART.wood}"/>
      <rect x="0" y="34" width="148" height="8" fill="${ART.woodLight}"/>
      <polygon points="-10,34 74,-2 158,34" fill="${ART.roofThatch}"/>
      <polygon points="-10,34 74,-2 74,10 -4,40" fill="${ART.roofThatchDark}" opacity="0.55"/>
      <rect x="12" y="42" width="10" height="50" fill="${ART.woodDark}"/>
      <rect x="126" y="42" width="10" height="50" fill="${ART.woodDark}"/>
      <!-- log pile -->
      <g transform="translate(28,62)">
        <circle cx="0" cy="16" r="9" fill="${ART.woodLight}" stroke="${ART.woodDark}" stroke-width="2"/>
        <circle cx="20" cy="16" r="9" fill="${ART.woodLight}" stroke="${ART.woodDark}" stroke-width="2"/>
        <circle cx="10" cy="2" r="9" fill="${ART.woodLight}" stroke="${ART.woodDark}" stroke-width="2"/>
        <circle cx="0" cy="16" r="3" fill="${ART.woodDark}"/>
        <circle cx="20" cy="16" r="3" fill="${ART.woodDark}"/>
        <circle cx="10" cy="2" r="3" fill="${ART.woodDark}"/>
      </g>
      <!-- saw blade -->
      <g transform="translate(104,66)">
        <circle cx="0" cy="0" r="15" fill="${ART.stone}" stroke="${ART.stoneDark}" stroke-width="2"/>
        <circle cx="0" cy="0" r="4" fill="${ART.stoneDark}"/>
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0"
                          dur="3s" repeatCount="indefinite" additive="sum"/>
      </g>
    </g>`,

  market_stall: (w, h) => `
    ${base(w, h)}
    <g transform="translate(${w / 2 - 66},${h - 96})">
      <rect x="6" y="44" width="120" height="42" fill="${ART.wood}"/>
      <rect x="0" y="38" width="132" height="10" rx="3" fill="${ART.woodLight}"/>
      <!-- striped canopy -->
      <g>
        <path d="M-6 38 q66 -42 144 0 z" fill="${ART.roofRed}"/>
        <path d="M18 26 q10 -6 20 -9 l6 21 q-12 3 -22 9 z" fill="#e8e0d0" opacity="0.9"/>
        <path d="M78 17 q12 3 22 9 l-8 21 q-10 -6 -20 -9 z" fill="#e8e0d0" opacity="0.9"/>
      </g>
      <rect x="0" y="38" width="8" height="52" fill="${ART.woodDark}"/>
      <rect x="124" y="38" width="8" height="52" fill="${ART.woodDark}"/>
      <!-- goods on the counter -->
      <circle cx="34" cy="52" r="6" fill="#c9563f"/>
      <circle cx="48" cy="52" r="6" fill="#d98b3a"/>
      <circle cx="62" cy="52" r="6" fill="#7ea84f"/>
      <rect x="76" y="46" width="14" height="12" rx="2" fill="${ART.woodDark}"/>
    </g>`,

  cafe: (w, h) => `
    ${base(w, h)}
    <g transform="translate(${w / 2 - 62},${h - 112})">
      <rect x="0" y="36" width="124" height="66" fill="${ART.plaster}"/>
      <rect x="0" y="36" width="124" height="66" fill="none" stroke="${ART.woodDark}" stroke-width="2"/>
      <rect x="0" y="90" width="124" height="12" fill="${ART.plasterShade}"/>
      <polygon points="-12,38 62,-4 136,38" fill="${ART.roofBlue}"/>
      <polygon points="-12,38 62,-4 62,8 -6,42" fill="${ART.roofBlueDark}" opacity="0.6"/>
      <rect x="86" y="-10" width="14" height="22" fill="${ART.stone}"/>
      ${smoke(93, -12)}
      ${windowPane(14, 52, 20, 20)}
      ${windowPane(90, 52, 20, 20)}
      <rect x="48" y="58" width="28" height="44" rx="3" fill="${ART.woodDark}"/>
      <circle cx="70" cy="82" r="2.5" fill="${ART.glow}"/>
      <!-- awning + table -->
      <path d="M6 44 q56 -14 112 0 l0 8 q-56 -14 -112 0 z" fill="${ART.roofRed}" opacity="0.9"/>
      <g transform="translate(-24,84)">
        <rect x="-2" y="0" width="4" height="16" fill="${ART.woodDark}"/>
        <ellipse cx="0" cy="0" rx="14" ry="5" fill="${ART.woodLight}"/>
        <text x="0" y="-4" text-anchor="middle" font-size="10">☕</text>
      </g>
    </g>`,

  apothecary: (w, h) => `
    ${base(w, h)}
    <g transform="translate(${w / 2 - 58},${h - 116})">
      <rect x="0" y="42" width="116" height="62" fill="${ART.plaster}" stroke="${ART.woodDark}" stroke-width="2"/>
      <!-- crooked witchy roof -->
      <polygon points="-14,44 40,-10 130,44" fill="${ART.roofPurple}"/>
      <polygon points="-14,44 40,-10 40,4 -6,48" fill="${ART.roofPurpleDark}" opacity="0.6"/>
      <rect x="86" y="4" width="12" height="26" fill="${ART.stone}" transform="rotate(6 92 16)"/>
      ${smoke(92, 2)}
      ${windowPane(16, 58, 18, 18)}
      ${windowPane(82, 58, 18, 18)}
      <rect x="46" y="64" width="26" height="40" rx="3" fill="${ART.woodDark}"/>
      <!-- hanging bottle sign -->
      <g transform="translate(104,52)">
        <rect x="-1" y="-14" width="2" height="14" fill="${ART.woodDark}"/>
        <rect x="-9" y="0" width="18" height="20" rx="4" fill="#7ec8b8" stroke="${ART.woodDark}" stroke-width="2"/>
        <rect x="-4" y="-5" width="8" height="6" fill="${ART.woodDark}"/>
      </g>
      <circle cx="24" cy="96" r="7" fill="#6fae9c" stroke="${ART.woodDark}" stroke-width="2"/>
    </g>`,

  smithy: (w, h) => `
    ${base(w, h)}
    <g transform="translate(${w / 2 - 68},${h - 108})">
      <rect x="0" y="40" width="136" height="62" fill="${ART.stone}" stroke="${ART.stoneDark}" stroke-width="2"/>
      <rect x="0" y="40" width="136" height="10" fill="${ART.stoneDark}"/>
      <polygon points="-12,40 68,-2 148,40" fill="${ART.roofGreen}"/>
      <polygon points="-12,40 68,-2 68,10 -6,44" fill="${ART.roofGreenDark}" opacity="0.6"/>
      <rect x="100" y="-8" width="16" height="24" fill="${ART.stoneDark}"/>
      ${smoke(108, -10)}
      <!-- forge glow -->
      <rect x="14" y="60" width="34" height="42" rx="3" fill="#2a1c14"/>
      <ellipse cx="31" cy="88" rx="14" ry="9" fill="#ff8a3c" opacity="0.85">
        <animate attributeName="opacity" values="0.55;0.95;0.55" dur="2.2s" repeatCount="indefinite"/>
      </ellipse>
      ${windowPane(96, 58, 18, 18)}
      <rect x="58" y="62" width="28" height="40" rx="3" fill="${ART.woodDark}"/>
      <!-- anvil -->
      <g transform="translate(-22,88)">
        <rect x="-12" y="6" width="24" height="8" rx="2" fill="${ART.stoneDark}"/>
        <rect x="-6" y="-2" width="12" height="8" fill="${ART.stone}"/>
        <path d="M-14 -6 h22 l-4 6 h-18 z" fill="${ART.stone}"/>
      </g>
    </g>`,

  inn: (w, h) => `
    ${base(w, h)}
    <g transform="translate(${w / 2 - 76},${h - 124})">
      <!-- two storeys -->
      <rect x="8" y="56" width="136" height="56" fill="${ART.plaster}" stroke="${ART.woodDark}" stroke-width="2"/>
      <rect x="0" y="26" width="152" height="34" fill="${ART.plasterShade}" stroke="${ART.woodDark}" stroke-width="2"/>
      <polygon points="-14,28 76,-14 166,28" fill="${ART.roofRed}"/>
      <polygon points="-14,28 76,-14 76,-2 -6,32" fill="${ART.roofRedDark}" opacity="0.6"/>
      <rect x="118" y="-12" width="16" height="28" fill="${ART.stone}"/>
      ${smoke(126, -14)}
      <!-- timber framing -->
      <g stroke="${ART.woodDark}" stroke-width="3" opacity="0.8">
        <line x1="30" y1="56" x2="30" y2="112"/>
        <line x1="122" y1="56" x2="122" y2="112"/>
        <line x1="8" y1="84" x2="144" y2="84"/>
      </g>
      ${windowPane(16, 34, 16, 16)}
      ${windowPane(68, 34, 16, 16)}
      ${windowPane(120, 34, 16, 16)}
      ${windowPane(40, 62, 18, 18)}
      ${windowPane(94, 62, 18, 18)}
      <rect x="64" y="76" width="30" height="36" rx="3" fill="${ART.woodDark}"/>
      <circle cx="88" cy="96" r="2.5" fill="${ART.glow}"/>
      <!-- hanging sign -->
      <g transform="translate(158,44)">
        <rect x="-14" y="-2" width="16" height="3" fill="${ART.woodDark}"/>
        <rect x="-6" y="1" width="2" height="10" fill="${ART.woodDark}"/>
        <rect x="-18" y="11" width="26" height="18" rx="3" fill="${ART.wood}" stroke="${ART.woodDark}" stroke-width="2"/>
        <text x="-5" y="24" text-anchor="middle" font-size="11">🛏️</text>
      </g>
    </g>`,
};

export function buildingArt(buildingId, w, h) {
  const fn = BUILDING_ART[buildingId];
  return fn ? fn(w, h) : '';
}

// Little staff figures milling about in front of a working building
export function staffFigures(count, w, h) {
  if (!count) return '';
  const out = [];
  for (let i = 0; i < Math.min(count, 3); i++) {
    const x = w / 2 - 30 + i * 30;
    const y = h - 26;
    const delay = (i * 0.7).toFixed(1);
    out.push(`
      <g transform="translate(${x},${y})">
        <ellipse cx="0" cy="6" rx="7" ry="3" fill="#000" opacity="0.3"/>
        <rect x="-4" y="-10" width="8" height="12" rx="3" fill="#5c7fb5"/>
        <circle cx="0" cy="-14" r="5" fill="#e8c39b"/>
        <animateTransform attributeName="transform" type="translate"
          values="${x},${y}; ${x + 6},${y - 2}; ${x},${y}" dur="5s" begin="${delay}s" repeatCount="indefinite"/>
      </g>`);
  }
  return out.join('');
}
