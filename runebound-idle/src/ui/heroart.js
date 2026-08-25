// ============================================================
// HERO ART — your character, drawn from a bag of integers
//
// Everything lives in a 140x160 box with the head centred at (70,58) and
// the shoulder line at y=124. Every part is drawn relative to those two
// anchors, so a new hairstyle or beard only has to agree with the head
// circle, not with every other part.
// ============================================================
import { SKIN, HAIR_COLOR, EYE_COLOR, CLOTH_COLOR, HAIR_STYLES, EYE_SHAPES,
         BROWS, MOUTHS, FACE_SHAPES, FACIAL_HAIR, MARKS, BUILDS,
         normalizeLook } from '../data/appearance.js';

// Head centre and the shoulder line. SHOULDER_Y sits just below the
// deepest chin any face shape produces (CY + max ry = 95), so the neck is
// always a short bridge rather than a floating gap.
const CX = 70, CY = 58, SHOULDER_Y = 104;

const pick = (list, i) => list[((i % list.length) + list.length) % list.length];

/** Darken a hex colour by `amt` (0..1) — for shading without extra palettes. */
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// ---------------- body ----------------

function body(look) {
  const cloth = pick(CLOTH_COLOR, look.cloth);
  const skin = pick(SKIN, look.skin);
  const build = pick(BUILDS, look.build);
  const face = pick(FACE_SHAPES, look.face);
  const w = 44 * build.shoulder;
  // Bridge from the actual chin of THIS face shape down to the shoulders,
  // so a long face doesn't leave the head hovering.
  const chin = CY + face.ry - 3;
  return `
    <!-- neck -->
    <path d="M${CX - 10} ${chin}
             L${CX - 9} ${SHOULDER_Y + 2}
             L${CX + 9} ${SHOULDER_Y + 2}
             L${CX + 10} ${chin} Z"
          fill="${shade(skin, 0.16)}"/>
    <!-- torso: shoulders sweep out from the neck, no gap -->
    <path d="M${CX - w} 160
             Q${CX - w - 2} ${SHOULDER_Y + 12} ${CX - w * 0.7} ${SHOULDER_Y + 2}
             Q${CX - 20} ${SHOULDER_Y - 6} ${CX} ${SHOULDER_Y - 7}
             Q${CX + 20} ${SHOULDER_Y - 6} ${CX + w * 0.7} ${SHOULDER_Y + 2}
             Q${CX + w + 2} ${SHOULDER_Y + 12} ${CX + w} 160 Z"
          fill="${cloth}" stroke="${shade(cloth, 0.35)}" stroke-width="2"/>
    <!-- collar sits over the neck join -->
    <path d="M${CX - 16} ${SHOULDER_Y - 5} Q${CX} ${SHOULDER_Y + 13} ${CX + 16} ${SHOULDER_Y - 5}
             Q${CX} ${SHOULDER_Y + 2} ${CX - 16} ${SHOULDER_Y - 5} Z"
          fill="${shade(cloth, 0.32)}"/>
    <!-- belt/trim across the chest -->
    <path d="M${CX - w * 0.9} ${SHOULDER_Y + 30} L${CX + w * 0.9} ${SHOULDER_Y + 30}"
          stroke="${shade(cloth, 0.45)}" stroke-width="3" fill="none" opacity="0.8"/>`;
}

// ---------------- head ----------------

function head(look) {
  const skin = pick(SKIN, look.skin);
  const face = pick(FACE_SHAPES, look.face);
  if (face.square) {
    return `<rect x="${CX - face.rx}" y="${CY - face.ry}" width="${face.rx * 2}" height="${face.ry * 2}"
                  rx="12" fill="${skin}" stroke="${shade(skin, 0.22)}" stroke-width="1.5"/>`;
  }
  if (face.taper) {
    // heart: wide at the temples, narrow at the chin
    return `<path d="M${CX} ${CY + face.ry}
                     Q${CX - face.rx} ${CY + face.ry * 0.35} ${CX - face.rx} ${CY - face.ry * 0.25}
                     Q${CX - face.rx} ${CY - face.ry} ${CX} ${CY - face.ry}
                     Q${CX + face.rx} ${CY - face.ry} ${CX + face.rx} ${CY - face.ry * 0.25}
                     Q${CX + face.rx} ${CY + face.ry * 0.35} ${CX} ${CY + face.ry} Z"
                  fill="${skin}" stroke="${shade(skin, 0.22)}" stroke-width="1.5"/>`;
  }
  return `<ellipse cx="${CX}" cy="${CY}" rx="${face.rx}" ry="${face.ry}"
                   fill="${skin}" stroke="${shade(skin, 0.22)}" stroke-width="1.5"/>`;
}

function ears(look) {
  const skin = pick(SKIN, look.skin);
  const face = pick(FACE_SHAPES, look.face);
  return `
    <ellipse cx="${CX - face.rx - 2}" cy="${CY + 5}" rx="5.5" ry="8"
             fill="${skin}" stroke="${shade(skin, 0.28)}" stroke-width="1.2"/>
    <ellipse cx="${CX + face.rx + 2}" cy="${CY + 5}" rx="5.5" ry="8"
             fill="${skin}" stroke="${shade(skin, 0.28)}" stroke-width="1.2"/>`;
}

// ---------------- hair ----------------

function hair(look) {
  const c = pick(HAIR_COLOR, look.hairCol);
  const dark = shade(c, 0.28);
  const face = pick(FACE_SHAPES, look.face);
  const rx = face.rx, ry = face.ry;
  const style = pick(HAIR_STYLES, look.hair).id;
  const top = CY - ry;

  switch (style) {
    case 'bald':
      return '';
    case 'crop':
      return `<path d="M${CX - rx - 1} ${CY - 6}
                       Q${CX - rx - 2} ${top - 8} ${CX} ${top - 8}
                       Q${CX + rx + 2} ${top - 8} ${CX + rx + 1} ${CY - 6}
                       Q${CX + rx * 0.5} ${CY - 20} ${CX} ${CY - 18}
                       Q${CX - rx * 0.5} ${CY - 20} ${CX - rx - 1} ${CY - 6} Z"
                    fill="${c}" stroke="${dark}" stroke-width="1.2"/>`;
    case 'swept':
      return `<path d="M${CX - rx - 2} ${CY - 2}
                       Q${CX - rx - 3} ${top - 9} ${CX + 2} ${top - 9}
                       Q${CX + rx + 4} ${top - 7} ${CX + rx + 2} ${CY - 8}
                       Q${CX + rx - 6} ${CY - 22} ${CX - 10} ${CY - 20}
                       Q${CX - rx + 2} ${CY - 16} ${CX - rx - 2} ${CY - 2} Z"
                    fill="${c}" stroke="${dark}" stroke-width="1.2"/>
              <path d="M${CX - 12} ${top - 6} Q${CX + 14} ${top - 2} ${CX + rx - 2} ${CY - 12}"
                    stroke="${dark}" stroke-width="1.6" fill="none" opacity="0.6"/>`;
    case 'long':
      return `<path d="M${CX - rx - 7} ${CY + 56}
                       Q${CX - rx - 11} ${CY - 10} ${CX - rx - 2} ${top - 7}
                       Q${CX} ${top - 14} ${CX + rx + 2} ${top - 7}
                       Q${CX + rx + 11} ${CY - 10} ${CX + rx + 7} ${CY + 56}
                       L${CX + rx - 2} ${CY + 52}
                       Q${CX + rx + 3} ${CY - 6} ${CX} ${CY - 16}
                       Q${CX - rx - 3} ${CY - 6} ${CX - rx + 2} ${CY + 52} Z"
                    fill="${c}" stroke="${dark}" stroke-width="1.2"/>`;
    case 'curls':
      return `<g fill="${c}" stroke="${dark}" stroke-width="1">
                ${[-26, -14, 0, 14, 26].map((dx, i) =>
                  `<circle cx="${CX + dx * (rx / 30)}" cy="${top - 2 + (i % 2 ? 3 : -3)}" r="12"/>`).join('')}
                <circle cx="${CX - rx - 2}" cy="${CY - 12}" r="10"/>
                <circle cx="${CX + rx + 2}" cy="${CY - 12}" r="10"/>
              </g>`;
    case 'topknot':
      return `<path d="M${CX - rx - 1} ${CY - 8}
                       Q${CX - rx} ${top - 5} ${CX} ${top - 5}
                       Q${CX + rx} ${top - 5} ${CX + rx + 1} ${CY - 8}
                       Q${CX} ${CY - 20} ${CX - rx - 1} ${CY - 8} Z"
                    fill="${c}" stroke="${dark}" stroke-width="1.2"/>
              <circle cx="${CX}" cy="${top - 12}" r="10" fill="${c}" stroke="${dark}" stroke-width="1.2"/>
              <rect x="${CX - 11}" y="${top - 6}" width="22" height="5" rx="2.5" fill="${dark}"/>`;
    case 'mohawk':
      return `<path d="M${CX - 9} ${CY - 10}
                       Q${CX - 11} ${top - 22} ${CX} ${top - 24}
                       Q${CX + 11} ${top - 22} ${CX + 9} ${CY - 10} Z"
                    fill="${c}" stroke="${dark}" stroke-width="1.2"/>
              <path d="M${CX - rx} ${CY - 8} Q${CX - rx + 4} ${top + 4} ${CX - 10} ${top + 2}"
                    stroke="${shade(c, 0.4)}" stroke-width="3" fill="none" opacity="0.5"/>
              <path d="M${CX + rx} ${CY - 8} Q${CX + rx - 4} ${top + 4} ${CX + 10} ${top + 2}"
                    stroke="${shade(c, 0.4)}" stroke-width="3" fill="none" opacity="0.5"/>`;
    case 'hooded': {
      const cloth = shade(pick(CLOTH_COLOR, look.cloth), 0.15);
      return `<path d="M${CX - rx - 9} ${CY + 20}
                       Q${CX - rx - 12} ${top - 20} ${CX} ${top - 20}
                       Q${CX + rx + 12} ${top - 20} ${CX + rx + 9} ${CY + 20}
                       Q${CX + rx - 2} ${CY - 4} ${CX} ${CY - 6}
                       Q${CX - rx + 2} ${CY - 4} ${CX - rx - 9} ${CY + 20} Z"
                    fill="${cloth}" stroke="${shade(cloth, 0.4)}" stroke-width="2"/>`;
    }
    default:
      return '';
  }
}

// ---------------- face parts ----------------

function eyes(look) {
  const col = pick(EYE_COLOR, look.eyeCol);
  const shape = pick(EYE_SHAPES, look.eyes).id;
  const y = CY + 2;
  const dx = 13;

  const one = s => {
    const x = CX + s * dx;
    switch (shape) {
      case 'sharp':
        return `<path d="M${x - 8} ${y} Q${x} ${y - 7} ${x + 8} ${y} Q${x} ${y + 4} ${x - 8} ${y} Z"
                      fill="#fff" stroke="#2a2a33" stroke-width="1.2"/>
                <circle cx="${x}" cy="${y - 1}" r="3.2" fill="${col}"/>`;
      case 'sleepy':
        return `<path d="M${x - 8} ${y} Q${x} ${y + 6} ${x + 8} ${y}" fill="#fff" stroke="#2a2a33" stroke-width="1.4"/>
                <circle cx="${x}" cy="${y + 1.5}" r="2.8" fill="${col}"/>
                <path d="M${x - 9} ${y - 1} Q${x} ${y - 4} ${x + 9} ${y - 1}" stroke="#2a2a33" stroke-width="1.8" fill="none"/>`;
      case 'wide':
        return `<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="#2a2a33" stroke-width="1.2"/>
                <circle cx="${x}" cy="${y}" r="3.6" fill="${col}"/>
                <circle cx="${x + 1.6}" cy="${y - 2}" r="1.4" fill="#fff"/>`;
      case 'stern':
        return `<ellipse cx="${x}" cy="${y}" rx="7.5" ry="4.5" fill="#fff" stroke="#2a2a33" stroke-width="1.2"/>
                <circle cx="${x}" cy="${y}" r="3" fill="${col}"/>
                <path d="M${x - 9} ${y - 4} L${x + 9} ${y - 6}" stroke="#2a2a33" stroke-width="2.2" stroke-linecap="round"/>`;
      case 'kind':
        return `<path d="M${x - 8} ${y + 2} Q${x} ${y - 6} ${x + 8} ${y + 2} Q${x} ${y + 6} ${x - 8} ${y + 2} Z"
                      fill="#fff" stroke="#2a2a33" stroke-width="1.2"/>
                <circle cx="${x}" cy="${y}" r="3.4" fill="${col}"/>
                <circle cx="${x + 1.4}" cy="${y - 1.6}" r="1.2" fill="#fff"/>`;
      default: // round
        return `<ellipse cx="${x}" cy="${y}" rx="7" ry="5.5" fill="#fff" stroke="#2a2a33" stroke-width="1.2"/>
                <circle cx="${x}" cy="${y}" r="3.2" fill="${col}"/>
                <circle cx="${x + 1.4}" cy="${y - 1.6}" r="1.2" fill="#fff"/>`;
    }
  };
  return one(-1) + one(1);
}

function brows(look) {
  const c = shade(pick(HAIR_COLOR, look.hairCol), 0.15);
  const shape = pick(BROWS, look.brows).id;
  const y = CY - 9;
  const dx = 13;
  const w = shape === 'thin' ? 1.8 : shape === 'thick' ? 4.2 : 2.8;
  const one = s => {
    const x = CX + s * dx;
    let d;
    if (shape === 'raised') d = `M${x - 8} ${y} Q${x} ${y - 7} ${x + 8} ${y - 2}`;
    else if (shape === 'furrow') d = `M${x - 8} ${y - 4} Q${x} ${y - 1} ${x + 8} ${y + 2}`;
    else d = `M${x - 8} ${y - 1} Q${x} ${y - 4} ${x + 8} ${y - 1}`;
    // mirror the asymmetric ones so both brows point the same way
    return `<path d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"
                  transform="${s < 0 ? `translate(${2 * x},0) scale(-1,1)` : ''}"/>`;
  };
  return one(-1) + one(1);
}

function mouth(look) {
  const skin = pick(SKIN, look.skin);
  const line = shade(skin, 0.55);
  const shape = pick(MOUTHS, look.mouth).id;
  const y = CY + 20;
  switch (shape) {
    case 'smile':
      return `<path d="M${CX - 9} ${y - 2} Q${CX} ${y + 7} ${CX + 9} ${y - 2}" stroke="${line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    case 'smirk':
      return `<path d="M${CX - 8} ${y + 1} Q${CX + 1} ${y + 5} ${CX + 9} ${y - 3}" stroke="${line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    case 'frown':
      return `<path d="M${CX - 9} ${y + 3} Q${CX} ${y - 4} ${CX + 9} ${y + 3}" stroke="${line}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    case 'open':
      return `<ellipse cx="${CX}" cy="${y + 1}" rx="6" ry="5" fill="${shade(skin, 0.7)}" stroke="${line}" stroke-width="1.4"/>`;
    default:
      return `<path d="M${CX - 8} ${y} L${CX + 8} ${y}" stroke="${line}" stroke-width="2.2" stroke-linecap="round"/>`;
  }
}

function facialHair(look) {
  const c = pick(HAIR_COLOR, look.hairCol);
  const style = pick(FACIAL_HAIR, look.beard).id;
  const face = pick(FACE_SHAPES, look.face);
  const y = CY + 20;
  switch (style) {
    case 'stubble':
      return `<path d="M${CX - face.rx + 4} ${CY + 8}
                       Q${CX} ${CY + face.ry + 4} ${CX + face.rx - 4} ${CY + 8}
                       Q${CX} ${CY + face.ry - 6} ${CX - face.rx + 4} ${CY + 8} Z"
                    fill="${c}" opacity="0.28"/>`;
    case 'goatee':
      return `<path d="M${CX - 8} ${y + 5} Q${CX} ${y + 18} ${CX + 8} ${y + 5}
                       Q${CX} ${y + 10} ${CX - 8} ${y + 5} Z" fill="${c}" stroke="${shade(c, 0.3)}" stroke-width="1"/>`;
    case 'full':
      return `<path d="M${CX - face.rx + 2} ${CY + 4}
                       Q${CX - face.rx + 4} ${CY + face.ry + 12} ${CX} ${CY + face.ry + 12}
                       Q${CX + face.rx - 4} ${CY + face.ry + 12} ${CX + face.rx - 2} ${CY + 4}
                       Q${CX} ${CY + 16} ${CX - face.rx + 2} ${CY + 4} Z"
                    fill="${c}" stroke="${shade(c, 0.3)}" stroke-width="1.2"/>`;
    case 'moustache':
      return `<path d="M${CX - 10} ${y - 5} Q${CX} ${y + 2} ${CX + 10} ${y - 5}
                       Q${CX} ${y - 9} ${CX - 10} ${y - 5} Z" fill="${c}" stroke="${shade(c, 0.3)}" stroke-width="1"/>`;
    default:
      return '';
  }
}

function marks(look) {
  const style = pick(MARKS, look.mark).id;
  const cloth = pick(CLOTH_COLOR, look.cloth);
  const skin = pick(SKIN, look.skin);
  switch (style) {
    case 'scar':
      return `<path d="M${CX + 17} ${CY - 12} L${CX + 21} ${CY + 6}" stroke="${shade(skin, 0.4)}" stroke-width="2" stroke-linecap="round"/>
              <path d="M${CX + 15} ${CY - 6} L${CX + 23} ${CY - 4}" stroke="${shade(skin, 0.4)}" stroke-width="1.6" stroke-linecap="round"/>`;
    case 'freckles':
      return `<g fill="${shade(skin, 0.3)}" opacity="0.8">
                ${[-10, -5, 0, 5, 10].map((dx, i) =>
                  `<circle cx="${CX + dx}" cy="${CY + 10 + (i % 2 ? 2 : 0)}" r="1.3"/>`).join('')}
              </g>`;
    case 'warpaint':
      return `<path d="M${CX - 22} ${CY + 1} L${CX - 4} ${CY + 1} L${CX - 4} ${CY + 6} L${CX - 22} ${CY + 6} Z" fill="${cloth}" opacity="0.75"/>
              <path d="M${CX + 4} ${CY + 1} L${CX + 22} ${CY + 1} L${CX + 22} ${CY + 6} L${CX + 4} ${CY + 6} Z" fill="${cloth}" opacity="0.75"/>`;
    case 'rune':
      // On the cheek, not the forehead: every hairstyle with a fringe
      // covered the forehead and swallowed it whole.
      return `<g stroke="#7ee0ff" stroke-width="1.8" fill="none" opacity="0.95"
                 style="filter:drop-shadow(0 0 3px rgba(126,224,255,0.7))">
                <path d="M${CX - 22} ${CY + 9} l7 0 l-3.5 7 z"/>
                <path d="M${CX - 18.5} ${CY + 16} l0 5"/>
                <path d="M${CX - 21} ${CY + 19} l5 0"/>
              </g>`;
    case 'glasses':
      return `<g stroke="#3a3a44" stroke-width="1.8" fill="rgba(255,255,255,0.14)">
                <rect x="${CX - 22}" y="${CY - 5}" width="17" height="14" rx="4"/>
                <rect x="${CX + 5}" y="${CY - 5}" width="17" height="14" rx="4"/>
                <path d="M${CX - 5} ${CY + 1} L${CX + 5} ${CY + 1}" fill="none"/>
              </g>`;
    default:
      return '';
  }
}

// ---------------- assembly ----------------
//
// Hair is the only part that needs to exist on BOTH sides of the head:
// a ponytail hangs behind while its cap sits in front, and long hair is a
// silhouette behind plus a fringe in front. Returning the two layers
// separately is what stops a style from drawing itself twice or vanishing
// under the face.

function hairLayers(look) {
  const style = pick(HAIR_STYLES, look.hair).id;
  switch (style) {
    case 'long':     return { back: hair(look), front: hairFringe(look) };
    case 'ponytail': return { back: ponytailTail(look), front: hairCap(look) };
    case 'braids':   return { back: braidStrands(look), front: hairCap(look) };
    case 'hooded':   return { back: hair(look), front: '' };
    default:         return { back: '', front: hair(look) };
  }
}

/** The hero, as SVG inner content for a 140x160 viewBox. */
export function heroArt(rawLook) {
  const look = normalizeLook(rawLook);
  const { back, front } = hairLayers(look);

  return `
    ${back}
    ${body(look)}
    ${ears(look)}
    ${head(look)}
    ${front}
    ${brows(look)}
    ${eyes(look)}
    ${mouth(look)}
    ${facialHair(look)}
    ${marks(look)}`;
}

/** A plain fringe, used by styles whose bulk is drawn behind the head. */
function hairFringe(look) {
  const c = pick(HAIR_COLOR, look.hairCol);
  const dark = shade(c, 0.28);
  const face = pick(FACE_SHAPES, look.face);
  const rx = face.rx, ry = face.ry, top = CY - ry;
  return `<path d="M${CX - rx - 1} ${CY - 6}
                   Q${CX - rx - 2} ${top - 7} ${CX} ${top - 7}
                   Q${CX + rx + 2} ${top - 7} ${CX + rx + 1} ${CY - 6}
                   Q${CX + rx * 0.5} ${CY - 20} ${CX} ${CY - 18}
                   Q${CX - rx * 0.5} ${CY - 20} ${CX - rx - 1} ${CY - 6} Z"
                fill="${c}" stroke="${dark}" stroke-width="1.2"/>`;
}

/** A close-fitting cap of hair, shared by ponytail and braids. */
function hairCap(look) {
  const c = pick(HAIR_COLOR, look.hairCol);
  const dark = shade(c, 0.28);
  const face = pick(FACE_SHAPES, look.face);
  const rx = face.rx, ry = face.ry, top = CY - ry;
  return `<path d="M${CX - rx - 1} ${CY - 4}
                   Q${CX - rx - 2} ${top - 9} ${CX} ${top - 9}
                   Q${CX + rx + 2} ${top - 9} ${CX + rx + 1} ${CY - 4}
                   Q${CX + rx * 0.4} ${CY - 21} ${CX} ${CY - 19}
                   Q${CX - rx * 0.4} ${CY - 21} ${CX - rx - 1} ${CY - 4} Z"
                fill="${c}" stroke="${dark}" stroke-width="1.2"/>`;
}

function ponytailTail(look) {
  const c = pick(HAIR_COLOR, look.hairCol);
  const dark = shade(c, 0.28);
  const face = pick(FACE_SHAPES, look.face);
  const rx = face.rx;
  return `<path d="M${CX + rx - 2} ${CY - 10}
                   Q${CX + rx + 16} ${CY + 6} ${CX + rx + 9} ${CY + 40}
                   Q${CX + rx + 3} ${CY + 42} ${CX + rx + 1} ${CY + 16} Z"
                fill="${shade(c, 0.1)}" stroke="${dark}" stroke-width="1.2"/>`;
}

function braidStrands(look) {
  const c = pick(HAIR_COLOR, look.hairCol);
  const dark = shade(c, 0.28);
  const face = pick(FACE_SHAPES, look.face);
  const rx = face.rx;
  return [-1, 1].map(s => `
    <g>${[0, 1, 2, 3].map(i => `
      <ellipse cx="${CX + s * (rx + 3)}" cy="${CY + 6 + i * 10}" rx="6" ry="6"
               fill="${i % 2 ? shade(c, 0.14) : c}" stroke="${dark}" stroke-width="1"/>`).join('')}
    </g>`).join('');
}

/** Convenience wrapper: a complete <svg> at a given pixel size. */
export function heroPortrait(look, size = 140) {
  return `<svg viewBox="0 0 140 160" width="${size}" height="${size * 160 / 140}"
               class="hero-svg">${heroArt(look)}</svg>`;
}

/** Head-and-shoulders crop, for the combat panel and nav. */
export function heroBust(look, size = 72) {
  return `<svg viewBox="14 12 112 112" width="${size}" height="${size}"
               class="hero-svg">${heroArt(look)}</svg>`;
}
