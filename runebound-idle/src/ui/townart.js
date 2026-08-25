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

const V = v => v || { roof: ART.roofRed, roofDark: ART.roofRedDark, wall: ART.plaster,
  wallShade: ART.plasterShade, widen: 0, heighten: 0, chimneyLeft: false, extraWindow: false };

const BUILDING_ART = {
  lumber_yard: (w, h, vr) => { const v = V(vr); const W = 148 + v.widen; const H = 58 + v.heighten;
    return `
    ${base(w, h)}
    <g transform="translate(${w / 2 - W / 2},${h - 46 - H})">
      <rect x="0" y="34" width="${W}" height="${H}" fill="${ART.wood}"/>
      <rect x="0" y="34" width="${W}" height="8" fill="${ART.woodLight}"/>
      <polygon points="-10,34 ${W / 2},-2 ${W + 10},34" fill="${v.roof}"/>
      <polygon points="-10,34 ${W / 2},-2 ${W / 2},10 -4,40" fill="${v.roofDark}" opacity="0.55"/>
      <rect x="12" y="42" width="10" height="${H - 8}" fill="${ART.woodDark}"/>
      <rect x="${W - 22}" y="42" width="10" height="${H - 8}" fill="${ART.woodDark}"/>
      <g transform="translate(28,${28 + H / 2})">
        <circle cx="0" cy="16" r="9" fill="${ART.woodLight}" stroke="${ART.woodDark}" stroke-width="2"/>
        <circle cx="20" cy="16" r="9" fill="${ART.woodLight}" stroke="${ART.woodDark}" stroke-width="2"/>
        <circle cx="10" cy="2" r="9" fill="${ART.woodLight}" stroke="${ART.woodDark}" stroke-width="2"/>
        <circle cx="0" cy="16" r="3" fill="${ART.woodDark}"/>
        <circle cx="20" cy="16" r="3" fill="${ART.woodDark}"/>
        <circle cx="10" cy="2" r="3" fill="${ART.woodDark}"/>
      </g>
      <g transform="translate(${W - 44},${32 + H / 2})">
        <circle cx="0" cy="0" r="15" fill="${ART.stone}" stroke="${ART.stoneDark}" stroke-width="2"/>
        <circle cx="0" cy="0" r="4" fill="${ART.stoneDark}"/>
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0"
                          dur="3s" repeatCount="indefinite" additive="sum"/>
      </g>
    </g>`; },

  market_stall: (w, h, vr) => { const v = V(vr); const W = 132 + v.widen;
    return `
    ${base(w, h)}
    <g transform="translate(${w / 2 - W / 2},${h - 96})">
      <rect x="6" y="44" width="${W - 12}" height="42" fill="${ART.wood}"/>
      <rect x="0" y="38" width="${W}" height="10" rx="3" fill="${ART.woodLight}"/>
      <path d="M-6 38 q${W / 2 + 6} -42 ${W + 12} 0 z" fill="${v.roof}"/>
      <path d="M${W * 0.14} 26 q10 -6 20 -9 l6 21 q-12 3 -22 9 z" fill="#e8e0d0" opacity="0.9"/>
      <path d="M${W * 0.59} 17 q12 3 22 9 l-8 21 q-10 -6 -20 -9 z" fill="#e8e0d0" opacity="0.9"/>
      <rect x="0" y="38" width="8" height="52" fill="${ART.woodDark}"/>
      <rect x="${W - 8}" y="38" width="8" height="52" fill="${ART.woodDark}"/>
      <circle cx="${W * 0.26}" cy="52" r="6" fill="#c9563f"/>
      <circle cx="${W * 0.36}" cy="52" r="6" fill="#d98b3a"/>
      <circle cx="${W * 0.47}" cy="52" r="6" fill="#7ea84f"/>
      ${v.extraWindow ? `<circle cx="${W * 0.58}" cy="52" r="6" fill="#b98ede"/>` : ''}
      <rect x="${W * 0.66}" y="46" width="14" height="12" rx="2" fill="${ART.woodDark}"/>
    </g>`; },

  cafe: (w, h, vr) => { const v = V(vr); const W = 124 + v.widen; const H = 66 + v.heighten;
    const cx = v.chimneyLeft ? 18 : W - 38;
    return `
    ${base(w, h)}
    <g transform="translate(${w / 2 - W / 2},${h - 46 - H})">
      <rect x="0" y="36" width="${W}" height="${H}" fill="${v.wall}" stroke="${ART.woodDark}" stroke-width="2"/>
      <rect x="0" y="${24 + H}" width="${W}" height="12" fill="${v.wallShade}"/>
      <polygon points="-12,38 ${W / 2},-4 ${W + 12},38" fill="${v.roof}"/>
      <polygon points="-12,38 ${W / 2},-4 ${W / 2},8 -6,42" fill="${v.roofDark}" opacity="0.6"/>
      <rect x="${cx}" y="-10" width="14" height="22" fill="${ART.stone}"/>
      ${smoke(cx + 7, -12)}
      ${windowPane(14, 52, 20, 20)}
      ${windowPane(W - 34, 52, 20, 20)}
      ${v.extraWindow ? windowPane(W / 2 - 10, 44, 16, 14) : ''}
      <rect x="${W / 2 - 14}" y="58" width="28" height="${H - 22}" rx="3" fill="${ART.woodDark}"/>
      <circle cx="${W / 2 + 8}" cy="82" r="2.5" fill="${ART.glow}"/>
      <path d="M6 44 q${W / 2 - 6} -14 ${W - 12} 0 l0 8 q-${W / 2 - 6} -14 -${W - 12} 0 z" fill="${ART.roofRed}" opacity="0.9"/>
    </g>`; },

  apothecary: (w, h, vr) => { const v = V(vr); const W = 116 + v.widen; const H = 62 + v.heighten;
    return `
    ${base(w, h)}
    <g transform="translate(${w / 2 - W / 2},${h - 50 - H})">
      <rect x="0" y="42" width="${W}" height="${H}" fill="${v.wall}" stroke="${ART.woodDark}" stroke-width="2"/>
      <polygon points="-14,44 ${W * 0.34},-10 ${W + 14},44" fill="${v.roof}"/>
      <polygon points="-14,44 ${W * 0.34},-10 ${W * 0.34},4 -6,48" fill="${v.roofDark}" opacity="0.6"/>
      <rect x="${W - 30}" y="4" width="12" height="26" fill="${ART.stone}" transform="rotate(6 ${W - 24} 16)"/>
      ${smoke(W - 24, 2)}
      ${windowPane(16, 58, 18, 18)}
      ${windowPane(W - 34, 58, 18, 18)}
      <rect x="${W / 2 - 13}" y="64" width="26" height="${H - 22}" rx="3" fill="${ART.woodDark}"/>
      <g transform="translate(${W - 12},52)">
        <rect x="-1" y="-14" width="2" height="14" fill="${ART.woodDark}"/>
        <rect x="-9" y="0" width="18" height="20" rx="4" fill="#7ec8b8" stroke="${ART.woodDark}" stroke-width="2"/>
        <rect x="-4" y="-5" width="8" height="6" fill="${ART.woodDark}"/>
      </g>
      <circle cx="24" cy="${H + 34}" r="7" fill="#6fae9c" stroke="${ART.woodDark}" stroke-width="2"/>
    </g>`; },

  smithy: (w, h, vr) => { const v = V(vr); const W = 136 + v.widen; const H = 62 + v.heighten;
    return `
    ${base(w, h)}
    <g transform="translate(${w / 2 - W / 2},${h - 46 - H})">
      <rect x="0" y="40" width="${W}" height="${H}" fill="${ART.stone}" stroke="${ART.stoneDark}" stroke-width="2"/>
      <rect x="0" y="40" width="${W}" height="10" fill="${ART.stoneDark}"/>
      <polygon points="-12,40 ${W / 2},-2 ${W + 12},40" fill="${v.roof}"/>
      <polygon points="-12,40 ${W / 2},-2 ${W / 2},10 -6,44" fill="${v.roofDark}" opacity="0.6"/>
      <rect x="${W - 36}" y="-8" width="16" height="24" fill="${ART.stoneDark}"/>
      ${smoke(W - 28, -10)}
      <rect x="14" y="60" width="34" height="${H - 20}" rx="3" fill="#2a1c14"/>
      <ellipse cx="31" cy="${H + 26}" rx="14" ry="9" fill="#ff8a3c" opacity="0.85">
        <animate attributeName="opacity" values="0.55;0.95;0.55" dur="2.2s" repeatCount="indefinite"/>
      </ellipse>
      ${windowPane(W - 40, 58, 18, 18)}
      <rect x="${W / 2 - 14}" y="62" width="28" height="${H - 22}" rx="3" fill="${ART.woodDark}"/>
    </g>`; },

  inn: (w, h, vr) => { const v = V(vr); const W = 152 + v.widen;
    return `
    ${base(w, h)}
    <g transform="translate(${w / 2 - W / 2},${h - 124})">
      <rect x="8" y="56" width="${W - 16}" height="56" fill="${v.wall}" stroke="${ART.woodDark}" stroke-width="2"/>
      <rect x="0" y="26" width="${W}" height="34" fill="${v.wallShade}" stroke="${ART.woodDark}" stroke-width="2"/>
      <polygon points="-14,28 ${W / 2},-14 ${W + 14},28" fill="${v.roof}"/>
      <polygon points="-14,28 ${W / 2},-14 ${W / 2},-2 -6,32" fill="${v.roofDark}" opacity="0.6"/>
      <rect x="${v.chimneyLeft ? 16 : W - 34}" y="-12" width="16" height="28" fill="${ART.stone}"/>
      ${smoke(v.chimneyLeft ? 24 : W - 26, -14)}
      <g stroke="${ART.woodDark}" stroke-width="3" opacity="0.8">
        <line x1="30" y1="56" x2="30" y2="112"/>
        <line x1="${W - 30}" y1="56" x2="${W - 30}" y2="112"/>
        <line x1="8" y1="84" x2="${W - 8}" y2="84"/>
      </g>
      ${windowPane(16, 34, 16, 16)}
      ${windowPane(W / 2 - 8, 34, 16, 16)}
      ${windowPane(W - 32, 34, 16, 16)}
      ${windowPane(40, 62, 18, 18)}
      ${windowPane(W - 58, 62, 18, 18)}
      <rect x="${W / 2 - 15}" y="76" width="30" height="36" rx="3" fill="${ART.woodDark}"/>
      <circle cx="${W / 2 + 9}" cy="96" r="2.5" fill="${ART.glow}"/>
    </g>`; },
};

// ============================================================
// VARIATION
// A tiny deterministic PRNG seeded by the plot index, so a given
// parcel always looks the same but no two parcels look alike:
// different roof colours, proportions, chimney and window placement,
// yard props and ground cover.
// ============================================================

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Roof palettes — each building type keeps a family, but picks within it
const ROOF_SETS = {
  lumber_yard: [[ART.roofThatch, ART.roofThatchDark], ['#a8834a', '#856437'], ['#c2a066', '#9c7c46']],
  market_stall: [[ART.roofRed, ART.roofRedDark], ['#b4553f', '#8d3f2e'], ['#8a6d3f', '#6b5230']],
  cafe: [[ART.roofBlue, ART.roofBlueDark], ['#4a7d8f', '#365f6d'], ['#5b6f9c', '#43537a']],
  apothecary: [[ART.roofPurple, ART.roofPurpleDark], ['#7a5590', '#5c4070'], ['#57608f', '#414a6e']],
  smithy: [[ART.roofGreen, ART.roofGreenDark], ['#3f6a56', '#2f5140'], ['#5a6b4a', '#445138']],
  inn: [[ART.roofRed, ART.roofRedDark], ['#9c5a3c', '#7a442c'], ['#8f4a52', '#6d363d']],
};

const WALL_SETS = [
  [ART.plaster, ART.plasterShade],
  ['#e0d3ba', '#c8b99c'],
  ['#cdbfa3', '#b3a488'],
  ['#d6c9b4', '#bdb096'],
];

/** Deterministic per-plot cosmetic variant. */
export function variantFor(buildingId, plotIndex) {
  const rand = mulberry(plotIndex * 7919 + (buildingId?.length || 3) * 104729);
  const roofs = ROOF_SETS[buildingId] || ROOF_SETS.cafe;
  const roof = roofs[Math.floor(rand() * roofs.length)];
  const wall = WALL_SETS[Math.floor(rand() * WALL_SETS.length)];
  return {
    roof: roof[0], roofDark: roof[1],
    wall: wall[0], wallShade: wall[1],
    widen: Math.round((rand() - 0.5) * 18),      // -9..+9 px wider/narrower
    heighten: Math.round((rand() - 0.5) * 12),
    chimneyLeft: rand() < 0.45,
    extraWindow: rand() < 0.5,
    flip: rand() < 0.5,
    prop: Math.floor(rand() * 5),                 // yard prop
    ground: Math.floor(rand() * 4),               // ground cover
    lantern: rand() < 0.55,
  };
}

// ---------- yard props & ground cover ----------

function yardProp(kind, w, h) {
  const x = 22, y = h - 30;
  switch (kind) {
    case 0: return `
      <g transform="translate(${x},${y})">
        <rect x="-9" y="-14" width="18" height="16" rx="2" fill="${ART.wood}" stroke="${ART.woodDark}" stroke-width="2"/>
        <line x1="-9" y1="-8" x2="9" y2="-8" stroke="${ART.woodDark}" stroke-width="2"/>
      </g>`;                                                       // crate
    case 1: return `
      <g transform="translate(${x},${y})">
        <ellipse cx="0" cy="0" rx="9" ry="4" fill="${ART.woodDark}"/>
        <rect x="-9" y="-16" width="18" height="16" rx="3" fill="${ART.woodLight}" stroke="${ART.woodDark}" stroke-width="2"/>
        <ellipse cx="0" cy="-16" rx="9" ry="4" fill="${ART.wood}"/>
      </g>`;                                                       // barrel
    case 2: return `
      <g transform="translate(${x},${y})">
        <rect x="-11" y="-6" width="22" height="7" rx="2" fill="#5f4a33"/>
        <circle cx="-4" cy="-9" r="3.5" fill="#d76b6b"/>
        <circle cx="2" cy="-10" r="3.5" fill="#e6c86a"/>
        <circle cx="8" cy="-9" r="3.5" fill="#b98ede"/>
      </g>`;                                                       // flower box
    case 3: return `
      <g transform="translate(${x},${y})">
        <circle cx="0" cy="-6" r="7" fill="#3a6141" stroke="${ART.woodDark}" stroke-width="1.5"/>
        <rect x="-2" y="0" width="4" height="6" fill="${ART.woodDark}"/>
      </g>`;                                                       // shrub
    default: return `
      <g transform="translate(${x},${y})">
        <rect x="-12" y="-4" width="24" height="5" rx="2" fill="${ART.wood}"/>
        <circle cx="-8" cy="3" r="4" fill="${ART.woodDark}"/>
        <circle cx="8" cy="3" r="4" fill="${ART.woodDark}"/>
        <rect x="-10" y="-12" width="20" height="9" rx="2" fill="${ART.woodLight}"/>
      </g>`;                                                       // hand cart
  }
}

function groundCover(kind, w, h) {
  switch (kind) {
    case 0: return `
      <g opacity="0.5">
        <ellipse cx="${w * 0.75}" cy="${h - 16}" rx="26" ry="8" fill="#3b6b45"/>
        <circle cx="${w * 0.70}" cy="${h - 18}" r="2" fill="#e6c86a"/>
        <circle cx="${w * 0.80}" cy="${h - 14}" r="2" fill="#d76b6b"/>
      </g>`;
    case 1: return `
      <g opacity="0.45">
        ${[0, 1, 2, 3].map(i => `<ellipse cx="${18 + i * 12}" cy="${h - 12}" rx="5" ry="2.5" fill="#7b6a4d"/>`).join('')}
      </g>`;
    case 2: return `
      <g opacity="0.4">
        <path d="M${w * 0.62} ${h - 12} q14 -6 28 0" stroke="#6f8f5f" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M${w * 0.66} ${h - 18} q10 -5 20 0" stroke="#6f8f5f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>`;
    default: return '';
  }
}

function lantern(w, h) {
  return `
    <g transform="translate(${w - 26},${h - 34})">
      <rect x="-1.5" y="0" width="3" height="24" fill="${ART.stoneDark}"/>
      <circle cx="0" cy="-6" r="8" fill="${ART.glow}" opacity="0.22"/>
      <rect x="-4.5" y="-11" width="9" height="11" rx="2" fill="${ART.stone}"/>
      <rect x="-2.5" y="-9" width="5" height="7" rx="1" fill="${ART.window}"/>
    </g>`;
}

/**
 * Draw a building for a specific parcel. Passing the plot index gives
 * each one its own colours, proportions and yard.
 */
export function buildingArt(buildingId, w, h, plotIndex = 0) {
  const fn = BUILDING_ART[buildingId];
  if (!fn) return '';
  const v = variantFor(buildingId, plotIndex);
  const body = fn(w, h, v);
  return `
    ${groundCover(v.ground, w, h)}
    <g ${v.flip ? `transform="translate(${w},0) scale(-1,1)"` : ''}>${body}</g>
    ${yardProp(v.prop, w, h)}
    ${v.lantern ? lantern(w, h) : ''}`;
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

// ---------- townsfolk ----------
// Anonymous residents walking the paths. Purely atmosphere — but they're
// what makes a raid feel like it took something.

const WALK_ROUTES = [
  { x1: 322, y1: 60,  x2: 322, y2: 560 },
  { x1: 622, y1: 560, x2: 622, y2: 60 },
  { x1: 40,  y1: 268, x2: 900, y2: 268 },
  { x1: 900, y1: 452, x2: 40,  y2: 452 },
  { x1: 322, y1: 268, x2: 622, y2: 268 },
  { x1: 622, y1: 452, x2: 322, y2: 452 },
];

export function townsfolk(count, looks) {
  if (!count) return '';
  const n = Math.min(count, 14);
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = WALK_ROUTES[i % WALK_ROUTES.length];
    const look = looks[i % looks.length];
    const dur = 22 + (i % 7) * 4;
    const delay = -(i * 3.1);
    out.push(`
      <g>
        <g>
          <ellipse cx="0" cy="7" rx="6" ry="2.5" fill="#000" opacity="0.28"/>
          <rect x="-3.5" y="-9" width="7" height="11" rx="3" fill="${look.body}"/>
          <circle cx="0" cy="-13" r="4.5" fill="${look.skin}"/>
          ${look.hat ? `<path d="M-6 -15 q6 -5 12 0 z" fill="${look.hat}"/>` : ''}
          <animateTransform attributeName="transform" type="translate"
            values="0,0; 0,-1.5; 0,0" dur="0.7s" repeatCount="indefinite"/>
        </g>
        <animateMotion dur="${dur}s" repeatCount="indefinite" begin="${delay}s"
          path="M${r.x1} ${r.y1} L${r.x2} ${r.y2} L${r.x1} ${r.y1}"/>
      </g>`);
  }
  return out.join('');
}

/** A notable standing at a fixed spot, with a hover title. */
export function notableFigure(n, x, y) {
  return `
    <g transform="translate(${x},${y})" class="town-notable">
      <title>${n.name} — ${n.role}</title>
      <ellipse cx="0" cy="9" rx="9" ry="3.5" fill="#000" opacity="0.3"/>
      <circle cx="0" cy="-10" r="14" fill="#12182a" opacity="0.55"/>
      <text y="-4" text-anchor="middle" font-size="19">${n.icon}</text>
    </g>`;
}
