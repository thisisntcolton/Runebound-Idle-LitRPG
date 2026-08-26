// ============================================================
// HEARTHWICK — hand-drawn SVG art
// Every building is drawn from primitives in a shared 220x150 plot box,
// in a light 3/4 view: a face, a pitched roof, and some character.
// ============================================================

// A wall clock every looping animation in this file phases against.
//
// The town map lives inside #main-panel, which renderView() rebuilds from
// innerHTML on every 'state-changed' — several times a second while a
// business is running. Each rebuild restarts every SVG animation at zero,
// which is what made the whole town twitch and snap. Giving every loop a
// negative `begin` derived from this clock makes the restart invisible:
// the DOM starts over, the animation resumes mid-stride.
const CLOCK = Date.now();
export const elapsed = () => (Date.now() - CLOCK) / 1000;
export const phaseOf = period => elapsed() % period;

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
  // Phased against the wall clock like everything else here, so a panel
  // rebuild does not snap every chimney back to its first puff in unison.
  const b = -(phaseOf(4));
  const b2 = -((phaseOf(4) + 2.6) % 4);
  return `
    <g opacity="0.5">
      <circle cx="${x}" cy="${y}" r="5" fill="#cfd6dd">
        <animate attributeName="cy" values="${y};${y - 24}" dur="4s" begin="${b.toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.55;0" dur="4s" begin="${b.toFixed(2)}s" repeatCount="indefinite"/>
      </circle>
      <circle cx="${x + 5}" cy="${y + 4}" r="4" fill="#cfd6dd">
        <animate attributeName="cy" values="${y + 4};${y - 18}" dur="4s" begin="${b2.toFixed(2)}s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0" dur="4s" begin="${b2.toFixed(2)}s" repeatCount="indefinite"/>
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
                          dur="3s" begin="${(-phaseOf(3)).toFixed(2)}s" repeatCount="indefinite" additive="sum"/>
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
        <animate attributeName="opacity" values="0.55;0.95;0.55" dur="2.2s" begin="${(-phaseOf(2.2)).toFixed(2)}s" repeatCount="indefinite"/>
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
    // Phased off the wall clock, not off `i`, so a panel rebuild leaves
    // them where they were instead of shunting all three back to the mark.
    const begin = -((phaseOf(5) + i * 1.6) % 5);
    const shirt = ['#5c7fb5', '#8a5a3c', '#4b7a52'][i % 3];
    const skin = ['#e8c39b', '#c9976b', '#f0d4b0'][i % 3];
    out.push(`
      <g transform="translate(${x},${y})">
        <ellipse cx="0" cy="6" rx="7" ry="3" fill="#000" opacity="0.3"/>
        <rect x="-4" y="-10" width="8" height="12" rx="3" fill="${shirt}"/>
        <circle cx="0" cy="-14" r="5" fill="${skin}"/>
        <animateTransform attributeName="transform" type="translate"
          values="${x},${y}; ${x + 6},${y - 2}; ${x},${y}" dur="5s" begin="${begin.toFixed(2)}s" repeatCount="indefinite"/>
      </g>`);
  }
  return out.join('');
}

// ============================================================
// TOWNSFOLK — the people, and the reason they stopped looking like a
// screensaver
//
// Two separate problems were making Hearthwick feel dead, and they had
// nothing to do with each other.
//
// 1. THE RESET. The town map is inside #main-panel, and renderView()
//    rebuilds that panel's innerHTML on every 'state-changed' — which
//    fires whenever gold moves, so several times a second while a
//    business is running. Every rebuild restarted every SVG animation
//    from zero, and the whole population teleported back to the top of
//    their walk. It read as a broken loop because it WAS a loop being
//    broken, constantly.
//
//    The fix is not to stop re-rendering — that is a much larger change
//    and the panel genuinely needs to update. It is to make the restart
//    invisible: every animation now begins at a NEGATIVE offset computed
//    from a wall clock, so a rebuilt figure resumes at the phase it
//    should already be at. The DOM restarts; the walk does not.
//
// 2. THE SAMENESS. Fourteen figures drawn from eight colour pairs, on six
//    straight lines, walking end to end forever. Now each resident is a
//    stable person: a face generated from the same appearance system the
//    player's own character uses, a name, a trade, and an errand route
//    with places they stop at and stand for a while.
// ============================================================

function mulberryOf(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return mulberry(h);
}

// ---------------- Where people go ----------------
//
// The roads are a grid (verticals at 322 and 622, horizontals at 268 and
// 452), so routes are built as orthogonal legs between named places. That
// keeps everybody on the paths rather than walking through the buildings,
// which is the thing that most reads as "these are not real people".

const XS = [322, 622];
const YS = [268, 452];

const DESTINATIONS = [
  { name: 'the well',        x: 322, y: 268 },
  { name: 'the crossroads',  x: 622, y: 268 },
  { name: 'the south corner',x: 322, y: 452 },
  { name: 'the east corner', x: 622, y: 452 },
  { name: 'the north gate',  x: 322, y: 60  },
  { name: 'the south gate',  x: 622, y: 570 },
  { name: 'the west road',   x: 46,  y: 268 },
  { name: 'the east road',   x: 906, y: 452 },
  { name: 'the notice board',x: 622, y: 150 },
  { name: 'the long fence',  x: 322, y: 545 },
];

/** An L-shaped leg from a to b, snapped to the road grid. */
function legPoints(a, b) {
  // Travel along whichever axis already shares a road, then turn.
  const corner = XS.includes(a.x) || a.x === b.x ? { x: a.x, y: b.y } : { x: b.x, y: a.y };
  return [corner, { x: b.x, y: b.y }];
}

function dist(a, b) { return Math.hypot(b.x - a.x, b.y - a.y); }

/**
 * Build an errand: three or four stops, with a pause at each.
 *
 * Returned as an SVG path plus matched keyPoints/keyTimes, which is how
 * SMIL is told to HOLD at a position: repeat a keyPoint across two
 * keyTimes and the figure stands there for that slice of the duration.
 * Without this everybody moves at a constant speed forever, which is the
 * other half of why the old version looked mechanical.
 */
function errandRoute(rand) {
  // A few pixels of lateral drift per person. Without it everyone walks
  // the exact centre line of the road and stacks into a single column at
  // every stop, which looks like one sprite with a rendering bug.
  const jx = Math.round((rand() - 0.5) * 22);
  const jy = Math.round((rand() - 0.5) * 22);
  const stops = [];
  const pool = [...DESTINATIONS];
  const nStops = 3 + Math.floor(rand() * 2);
  for (let i = 0; i < nStops; i++) {
    stops.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  stops.push(stops[0]);            // come home, so the loop never jumps

  const pts = [{ x: stops[0].x, y: stops[0].y }];
  const stopAt = [0];              // indices into pts where they linger
  for (let i = 1; i < stops.length; i++) {
    pts.push(...legPoints(pts[pts.length - 1], stops[i]));
    stopAt.push(pts.length - 1);
  }

  // Cumulative length, so keyPoints can be expressed as path fractions.
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
  const total = cum[cum.length - 1] || 1;

  // Time budget: walking is proportional to distance, and each stop eats
  // a fixed slice. Pauses are 8-20% of the loop each.
  const pauses = stopAt.slice(1, -1).map(() => 0.06 + rand() * 0.07);
  const pauseTotal = pauses.reduce((s, p) => s + p, 0);
  const walkShare = 1 - pauseTotal;

  const keyPoints = [], keyTimes = [];
  let t = 0, pauseIdx = 0;
  for (let i = 0; i < pts.length; i++) {
    const f = cum[i] / total;
    if (i > 0) t += (cum[i] - cum[i - 1]) / total * walkShare;
    keyPoints.push(f.toFixed(4));
    keyTimes.push(Math.min(1, t).toFixed(4));
    // Linger here?
    if (i > 0 && i < pts.length - 1 && stopAt.includes(i)) {
      t += pauses[pauseIdx++] ?? 0;
      keyPoints.push(f.toFixed(4));
      keyTimes.push(Math.min(1, t).toFixed(4));
    }
  }
  // SMIL requires the last keyTime to be exactly 1.
  keyTimes[keyTimes.length - 1] = '1';

  const path = 'M' + pts.map(p => `${Math.round(p.x) + jx} ${Math.round(p.y) + jy}`).join(' L');
  return { path, keyPoints: keyPoints.join(';'), keyTimes: keyTimes.join(';'), stops, total };
}

// ---------------- Who they are ----------------

/**
 * A stable cast for this town. Seeded off the town's name and the
 * resident's index, so the same person is in the same coat every session
 * and the population growing does not reshuffle everyone who was already
 * there.
 */
export function villagerRoster(count, seedKey, { NAMES, TRADES, ERRANDS, look }) {
  const out = [];
  // Names are dealt from a deterministically shuffled deck rather than
  // rolled per person, so a village of sixteen does not contain three
  // Kesters — which it did, and which read as generated rather than real.
  const deck = [...NAMES];
  const shuffleRand = mulberryOf(`${seedKey}:names`);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(shuffleRand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  for (let i = 0; i < count; i++) {
    const rand = mulberryOf(`${seedKey}#${i}`);
    out.push({
      i,
      name: deck[i % deck.length] + (i >= deck.length ? ' the Younger' : ''),
      trade: TRADES[Math.floor(rand() * TRADES.length)],
      errand: ERRANDS[Math.floor(rand() * ERRANDS.length)],
      look: look(rand),
      // Everything below is cosmetic drawing state.
      hat: rand() < 0.28,
      pack: rand() < 0.22,
      apron: rand() < 0.30,
      scale: 1.05 + rand() * 0.4,
      speed: 46 + rand() * 46,       // seconds for a whole errand loop
      phase: rand() * 60,
      route: errandRoute(rand),
    });
  }
  return out;
}

/**
 * One resident, drawn small. Deliberately not the full hero renderer —
 * at fourteen pixels tall the only things that read are silhouette and
 * colour, so this takes the three colours and the build from the look and
 * spends its detail on hair shape and carried objects instead.
 */
function villagerFigure(v, palettes) {
  const skin = palettes.SKIN[v.look.skin];
  const hairC = palettes.HAIR_COLOR[v.look.hairCol];
  const cloth = palettes.CLOTH_COLOR[v.look.cloth];
  const hairId = palettes.HAIR_STYLES[v.look.hair]?.id || 'crop';
  const shoulder = palettes.BUILDS[v.look.build]?.shoulder ?? 1;
  const w = 7 * shoulder;

  // Hair silhouettes, chosen to be distinguishable at this size.
  const hair = {
    bald:    '',
    crop:    `<path d="M-4.6 -14.6 q4.6 -4.4 9.2 0 q-4.6 -2 -9.2 0 z" fill="${hairC}"/>`,
    swept:   `<path d="M-4.8 -14.4 q5 -5 9.6 -0.6 l-2 -3.4 q-5 -1.6 -7.6 4 z" fill="${hairC}"/>`,
    long:    `<path d="M-5 -15 q5 -5 10 0 l0.6 8 q-5.6 -2.4 -11.2 0 z" fill="${hairC}"/>`,
    ponytail:`<path d="M-4.6 -14.6 q4.6 -4.4 9.2 0 z" fill="${hairC}"/><path d="M4 -13 q4 2 2.6 7 q-2 -3.4 -3.6 -4.4 z" fill="${hairC}"/>`,
    braids:  `<path d="M-4.6 -14.6 q4.6 -4.4 9.2 0 z" fill="${hairC}"/><circle cx="-5.4" cy="-9" r="1.7" fill="${hairC}"/><circle cx="5.4" cy="-9" r="1.7" fill="${hairC}"/>`,
    curls:   `<circle cx="-3" cy="-15" r="2.6" fill="${hairC}"/><circle cx="0.4" cy="-16.4" r="2.8" fill="${hairC}"/><circle cx="3.6" cy="-15" r="2.6" fill="${hairC}"/>`,
    topknot: `<path d="M-4.6 -14.6 q4.6 -4.4 9.2 0 z" fill="${hairC}"/><circle cx="0" cy="-18" r="2.4" fill="${hairC}"/>`,
    mohawk:  `<path d="M-1.4 -18.6 l2.8 0 l0 5 l-2.8 0 z" fill="${hairC}"/>`,
    hooded:  `<path d="M-6 -9 q0 -9 6 -9 q6 0 6 9 q-6 -3 -12 0 z" fill="${hairC}"/>`,
  }[hairId] ?? '';

  return `
    <ellipse cx="0" cy="7" rx="${5.4 * shoulder}" ry="2.4" fill="#000" opacity="0.28"/>
    <rect x="${-w / 2}" y="-9" width="${w}" height="11" rx="3" fill="${cloth}"/>
    ${v.apron ? `<rect x="${-w / 2 + 0.8}" y="-4" width="${w - 1.6}" height="6" rx="1.5" fill="#e8dcc0" opacity="0.75"/>` : ''}
    ${v.pack ? `<rect x="${w / 2 - 1}" y="-7" width="4.5" height="6" rx="1.5" fill="#7a5233"/>` : ''}
    <circle cx="0" cy="-13" r="4.6" fill="${skin}"/>
    ${hair}
    ${v.hat ? `<path d="M-6.4 -15.4 q6.4 -5.2 12.8 0 z" fill="#6b4a2a"/><rect x="-3.4" y="-19.4" width="6.8" height="4.4" rx="1.4" fill="#6b4a2a"/>` : ''}`;
}

/**
 * The whole population, walking their errands.
 *
 * `seedKey` should be something stable about the town (its name) so the
 * cast does not change identity on every render.
 */
export function townsfolk(count, palettes, seedKey = 'hearthwick') {
  if (!count) return '';
  const n = Math.min(count, 16);
  const roster = villagerRoster(n, seedKey, palettes);
  const t = elapsed();

  return roster.map(v => {
    const r = v.route;
    // Negative begin: the figure resumes at the phase it would already be
    // at, so rebuilding the panel does not teleport anybody.
    const begin = -((t + v.phase) % v.speed);
    // The bob is a separate, much shorter cycle, phased the same way.
    const bobBegin = -((t + v.phase) % 0.72);
    return `
      <g class="villager">
        <title>${v.name} the ${v.trade} — ${v.errand}</title>
        <g transform="scale(${v.scale.toFixed(2)})">
          <g>
            ${villagerFigure(v, palettes)}
            <animateTransform attributeName="transform" type="translate"
              values="0,0; 0,-1.4; 0,0" dur="0.72s" begin="${bobBegin.toFixed(2)}s"
              repeatCount="indefinite"/>
          </g>
        </g>
        <animateMotion dur="${v.speed.toFixed(1)}s" repeatCount="indefinite"
          begin="${begin.toFixed(2)}s" calcMode="linear"
          keyPoints="${r.keyPoints}" keyTimes="${r.keyTimes}"
          path="${r.path}"/>
      </g>`;
  }).join('');
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
