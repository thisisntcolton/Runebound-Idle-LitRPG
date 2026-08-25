// ============================================================
// PET ART — hand-drawn SVG creatures
//
// Every pet is drawn in a 120x120 box, centred on (60,80) as the
// "floor" point, then scaled by growth stage. Each has a gentle idle
// animation and eyes that respond to mood.
// ============================================================
import { getSpecies, stageFor } from '../data/pets.js';

// ---------- shared pieces ----------

function shadow(rx = 22) {
  return `<ellipse cx="60" cy="102" rx="${rx}" ry="6" fill="#000" opacity="0.28"/>`;
}

function eyes(p, mood, cx = 60, cy = 62, spread = 10, r = 3.4) {
  if (mood === 'miserable' || mood === 'lonely') {
    // downturned, half-lidded
    return `
      <path d="M${cx - spread - 4} ${cy - 1} q4 4 8 0" stroke="#2a2a33" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M${cx + spread - 4} ${cy - 1} q4 4 8 0" stroke="#2a2a33" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  }
  if (mood === 'thriving') {
    // happy closed arcs
    return `
      <path d="M${cx - spread - 4} ${cy + 1} q4 -5 8 0" stroke="#2a2a33" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M${cx + spread - 4} ${cy + 1} q4 -5 8 0" stroke="#2a2a33" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }
  return `
    <circle cx="${cx - spread}" cy="${cy}" r="${r}" fill="${p.eye}"/>
    <circle cx="${cx + spread}" cy="${cy}" r="${r}" fill="${p.eye}"/>
    <circle cx="${cx - spread + 1}" cy="${cy - 1}" r="1.2" fill="#fff" opacity="0.9"/>
    <circle cx="${cx + spread + 1}" cy="${cy - 1}" r="1.2" fill="#fff" opacity="0.9"/>`;
}

// A slow breathing bob applied to the whole creature
function idleBob(inner, dur = 3.2, amp = 2.5) {
  return `
    <g>
      ${inner}
      <animateTransform attributeName="transform" type="translate"
        values="0,0; 0,-${amp}; 0,0" dur="${dur}s" repeatCount="indefinite"/>
    </g>`;
}

// ---------- egg ----------
export function eggArt(speciesId, pct = 0) {
  const sp = getSpecies(speciesId);
  const p = sp.palette;
  const wobble = pct > 0.75 ? 1.6 : pct > 0.4 ? 0.8 : 0.3;
  return `
    <g>
      ${shadow(18)}
      <g>
        <ellipse cx="60" cy="72" rx="26" ry="32" fill="${p.belly}" stroke="${p.accent}" stroke-width="2.5"/>
        <ellipse cx="52" cy="60" rx="7" ry="9" fill="#fff" opacity="0.45"/>
        <circle cx="70" cy="80" r="4" fill="${p.body}" opacity="0.45"/>
        <circle cx="54" cy="88" r="3" fill="${p.body}" opacity="0.35"/>
        <circle cx="66" cy="58" r="2.5" fill="${p.body}" opacity="0.35"/>
        ${pct > 0.75 ? `<path d="M44 66 l8 6 l-6 6" stroke="${p.accent}" stroke-width="2" fill="none"/>` : ''}
        <animateTransform attributeName="transform" type="rotate"
          values="-${wobble} 60 100; ${wobble} 60 100; -${wobble} 60 100"
          dur="${pct > 0.75 ? 0.9 : 2.4}s" repeatCount="indefinite"/>
      </g>
    </g>`;
}

// ---------- creatures ----------

const ART = {
  cat: (p, m) => idleBob(`
    ${shadow()}
    <!-- tail -->
    <path d="M84 84 q18 -4 12 -22" stroke="${p.body}" stroke-width="7" fill="none" stroke-linecap="round">
      <animate attributeName="d" values="M84 84 q18 -4 12 -22; M84 84 q20 -10 8 -24; M84 84 q18 -4 12 -22"
               dur="2.6s" repeatCount="indefinite"/>
    </path>
    <!-- body -->
    <ellipse cx="60" cy="84" rx="26" ry="18" fill="${p.body}"/>
    <ellipse cx="60" cy="88" rx="17" ry="12" fill="${p.belly}"/>
    <!-- head -->
    <circle cx="60" cy="60" r="22" fill="${p.body}"/>
    <path d="M42 46 l2 -16 l14 9 z" fill="${p.body}"/>
    <path d="M78 46 l-2 -16 l-14 9 z" fill="${p.body}"/>
    <path d="M45 45 l1.5 -9 l7 5 z" fill="${p.accent}"/>
    <path d="M75 45 l-1.5 -9 l-7 5 z" fill="${p.accent}"/>
    ${eyes(p, m)}
    <path d="M57 70 l3 3 l3 -3 z" fill="${p.accent}"/>
    <path d="M60 73 q-5 5 -9 2 M60 73 q5 5 9 2" stroke="#2a2a33" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <g stroke="${p.belly}" stroke-width="1.4" opacity="0.85">
      <line x1="36" y1="64" x2="22" y2="61"/><line x1="36" y1="68" x2="22" y2="69"/>
      <line x1="84" y1="64" x2="98" y2="61"/><line x1="84" y1="68" x2="98" y2="69"/>
    </g>`),

  dog: (p, m) => idleBob(`
    ${shadow()}
    <path d="M84 82 q14 -6 10 -18" stroke="${p.body}" stroke-width="8" fill="none" stroke-linecap="round">
      <animate attributeName="d" values="M84 82 q14 -6 10 -18; M84 82 q18 -2 16 -14; M84 82 q14 -6 10 -18"
               dur="0.9s" repeatCount="indefinite"/>
    </path>
    <ellipse cx="60" cy="84" rx="27" ry="18" fill="${p.body}"/>
    <ellipse cx="60" cy="89" rx="18" ry="11" fill="${p.belly}"/>
    <circle cx="60" cy="58" r="23" fill="${p.body}"/>
    <!-- floppy ears -->
    <ellipse cx="38" cy="56" rx="8" ry="16" fill="${p.accent}" transform="rotate(-12 38 56)"/>
    <ellipse cx="82" cy="56" rx="8" ry="16" fill="${p.accent}" transform="rotate(12 82 56)"/>
    <ellipse cx="60" cy="70" rx="13" ry="10" fill="${p.belly}"/>
    ${eyes(p, m, 60, 54)}
    <ellipse cx="60" cy="66" rx="5" ry="4" fill="#2a2a33"/>
    <path d="M60 70 v4 M60 74 q-5 4 -9 1 M60 74 q5 4 9 1" stroke="#2a2a33" stroke-width="1.7" fill="none" stroke-linecap="round"/>
    <path d="M55 78 q5 5 10 0" stroke="${p.accent}" stroke-width="2" fill="none" stroke-linecap="round"/>`, 2.6, 3),

  frog: (p, m) => idleBob(`
    ${shadow(24)}
    <ellipse cx="60" cy="82" rx="30" ry="21" fill="${p.body}"/>
    <ellipse cx="60" cy="88" rx="20" ry="13" fill="${p.belly}"/>
    <!-- back legs -->
    <path d="M32 92 q-10 2 -8 10 q8 2 12 -4" fill="${p.body}"/>
    <path d="M88 92 q10 2 8 10 q-8 2 -12 -4" fill="${p.body}"/>
    <!-- eye bulges sit on top of the head -->
    <circle cx="46" cy="56" r="12" fill="${p.body}"/>
    <circle cx="74" cy="56" r="12" fill="${p.body}"/>
    ${m === 'miserable' || m === 'lonely'
      ? `<path d="M40 56 q6 5 12 0" stroke="#2a2a33" stroke-width="2.4" fill="none" stroke-linecap="round"/>
         <path d="M68 56 q6 5 12 0" stroke="#2a2a33" stroke-width="2.4" fill="none" stroke-linecap="round"/>`
      : `<circle cx="46" cy="55" r="7" fill="#fff"/><circle cx="74" cy="55" r="7" fill="#fff"/>
         <circle cx="46" cy="55" r="4" fill="${p.eye}"/><circle cx="74" cy="55" r="4" fill="${p.eye}"/>
         <circle cx="46" cy="55" r="2" fill="#1a1a22"/><circle cx="74" cy="55" r="2" fill="#1a1a22"/>`}
    <path d="M44 78 q16 10 32 0" stroke="${p.accent}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <circle cx="40" cy="72" r="3" fill="${p.accent}" opacity="0.5"/>
    <circle cx="80" cy="74" r="2.5" fill="${p.accent}" opacity="0.5"/>`, 2.2, 2),

  poro: (p, m) => idleBob(`
    ${shadow(26)}
    <!-- a ball of fluff, drawn as overlapping puffs -->
    <circle cx="60" cy="70" r="30" fill="${p.body}"/>
    <circle cx="38" cy="76" r="16" fill="${p.body}"/>
    <circle cx="82" cy="76" r="16" fill="${p.body}"/>
    <circle cx="46" cy="48" r="15" fill="${p.body}"/>
    <circle cx="74" cy="48" r="15" fill="${p.body}"/>
    <circle cx="60" cy="44" r="16" fill="${p.body}"/>
    <!-- horns -->
    <path d="M44 34 q-3 -12 4 -16 q3 8 1 16 z" fill="${p.accent}"/>
    <path d="M76 34 q3 -12 -4 -16 q-3 8 -1 16 z" fill="${p.accent}"/>
    ${eyes(p, m, 60, 66, 12, 3.6)}
    <!-- the tongue, obviously -->
    <path d="M56 78 q4 10 8 0 z" fill="${p.accent}">
      <animate attributeName="d" values="M56 78 q4 10 8 0 z; M56 78 q4 14 8 0 z; M56 78 q4 10 8 0 z"
               dur="3.4s" repeatCount="indefinite"/>
    </path>
    <circle cx="42" cy="72" r="4" fill="${p.accent}" opacity="0.35"/>
    <circle cx="78" cy="72" r="4" fill="${p.accent}" opacity="0.35"/>`, 3.6, 3.5),

  wyrmling: (p, m) => idleBob(`
    ${shadow(22)}
    <!-- tail -->
    <path d="M80 86 q22 0 20 -20 q-2 -8 -8 -6" stroke="${p.body}" stroke-width="7" fill="none" stroke-linecap="round">
      <animate attributeName="d" values="M80 86 q22 0 20 -20 q-2 -8 -8 -6; M80 86 q24 -6 16 -24 q-4 -6 -10 -2; M80 86 q22 0 20 -20 q-2 -8 -8 -6"
               dur="3s" repeatCount="indefinite"/>
    </path>
    <!-- wings -->
    <path d="M40 62 q-22 -14 -26 4 q14 2 24 8 z" fill="${p.accent}">
      <animate attributeName="d" values="M40 62 q-22 -14 -26 4 q14 2 24 8 z; M40 62 q-24 -20 -28 0 q14 4 26 10 z; M40 62 q-22 -14 -26 4 q14 2 24 8 z"
               dur="1.6s" repeatCount="indefinite"/>
    </path>
    <path d="M80 62 q22 -14 26 4 q-14 2 -24 8 z" fill="${p.accent}">
      <animate attributeName="d" values="M80 62 q22 -14 26 4 q-14 2 -24 8 z; M80 62 q24 -20 28 0 q-14 4 -26 10 z; M80 62 q22 -14 26 4 q-14 2 -24 8 z"
               dur="1.6s" repeatCount="indefinite"/>
    </path>
    <ellipse cx="60" cy="82" rx="24" ry="17" fill="${p.body}"/>
    <ellipse cx="60" cy="86" rx="15" ry="11" fill="${p.belly}"/>
    <circle cx="60" cy="58" r="20" fill="${p.body}"/>
    <!-- snout -->
    <ellipse cx="60" cy="68" rx="12" ry="8" fill="${p.body}"/>
    <circle cx="56" cy="68" r="1.6" fill="#2a2a33"/><circle cx="64" cy="68" r="1.6" fill="#2a2a33"/>
    <!-- horns -->
    <path d="M46 42 q-4 -12 3 -14 q3 7 2 14 z" fill="${p.accent}"/>
    <path d="M74 42 q4 -12 -3 -14 q-3 7 -2 14 z" fill="${p.accent}"/>
    ${eyes(p, m, 60, 55, 9, 3.2)}
    <!-- spines -->
    <path d="M60 38 l4 -7 l4 7 z" fill="${p.accent}" opacity="0.8"/>`, 3, 3),
};

// ---------- mood, made visible ----------
// The eyes alone are too subtle at roster size, and in a Tamagotchi the
// single most important thing to read at a glance is "does this creature
// need me right now". So mood also drives colour, posture and a small
// drawn cue floating beside the pet.

// Emitted inside every drained pet's own <svg> rather than once per page:
// each portrait is a separate SVG element, and the one holding a shared
// <defs> can be re-rendered away at any moment, silently breaking the rest.
// The definitions are identical, so the duplicate ids are harmless.
function sadFilter() {
  return `<defs><filter id="pet-drained">
    <feColorMatrix type="saturate" values="0.28"/>
  </filter></defs>`;
}

function moodCue(moodId) {
  switch (moodId) {
    case 'hungry':
      // an empty bowl, tipped over
      return `<g transform="translate(96,34)" opacity="0.95">
        <path d="M-9 0 q9 9 18 0 z" fill="#c9a24a" stroke="#7a6128" stroke-width="1.4"/>
        <ellipse cx="0" cy="0" rx="9" ry="2.4" fill="#e0bd63" stroke="#7a6128" stroke-width="1.2"/>
        <animateTransform attributeName="transform" type="translate"
          values="96,34; 96,30; 96,34" dur="2.4s" repeatCount="indefinite"/>
      </g>`;
    case 'lonely':
      // a single tear
      return `<g transform="translate(96,34)" opacity="0.95">
        <path d="M0 -7 q6 8 0 12 q-6 -4 0 -12 z" fill="#7ec8f0" stroke="#3f8fbd" stroke-width="1.2"/>
        <animateTransform attributeName="transform" type="translate"
          values="96,30; 96,40; 96,30" dur="2.8s" repeatCount="indefinite"/>
      </g>`;
    case 'miserable':
      // a small rain cloud, because it is having a day
      return `<g transform="translate(94,30)" opacity="0.95">
        <path d="M-13 2 a7 7 0 0 1 7 -7 a9 9 0 0 1 17 2 a6 6 0 0 1 -2 11 h-15 a6 6 0 0 1 -7 -6 z"
              fill="#5b6478" stroke="#39404f" stroke-width="1.3"/>
        <g stroke="#7ec8f0" stroke-width="2" stroke-linecap="round">
          <line x1="-6" y1="11" x2="-8" y2="17"/>
          <line x1="2" y1="11" x2="0" y2="18"/>
          <line x1="9" y1="11" x2="7" y2="16"/>
          <animate attributeName="opacity" values="1;0.25;1" dur="1.6s" repeatCount="indefinite"/>
        </g>
      </g>`;
    case 'thriving':
      // sparkles, both sides
      return `<g fill="#ffd97a" opacity="0.9">
        <path d="M99 30 l2.4 5.6 l5.6 2.4 l-5.6 2.4 l-2.4 5.6 l-2.4 -5.6 l-5.6 -2.4 l5.6 -2.4 z">
          <animate attributeName="opacity" values="0.35;1;0.35" dur="2.2s" repeatCount="indefinite"/>
        </path>
        <path d="M20 44 l1.7 4 l4 1.7 l-4 1.7 l-1.7 4 l-1.7 -4 l-4 -1.7 l4 -1.7 z">
          <animate attributeName="opacity" values="1;0.3;1" dur="2.6s" repeatCount="indefinite"/>
        </path>
      </g>`;
    default:
      return '';
  }
}

/**
 * Full pet artwork.
 * @param {object} pet  the pet record
 * @param {string} moodId  from mood(pet).id
 */
export function petArt(pet, moodId = 'content') {
  const sp = getSpecies(pet.species);
  if (!sp) return '';
  const stage = stageFor(petStageLevel(pet));
  const fn = ART[sp.id];
  if (!fn) return '';
  const body = fn(sp.palette, moodId);
  const s = stage.scale;

  // A miserable pet goes grey and slumps; a merely hungry or lonely one
  // keeps its colour but still droops a little.
  const drained = moodId === 'miserable';
  const droop = drained ? 4 : (moodId === 'hungry' || moodId === 'lonely') ? 2 : 0;
  const open = drained ? '<g filter="url(#pet-drained)" opacity="0.9">' : '<g>';

  return `${drained ? sadFilter() : ''}
    ${open}
      <g transform="translate(60,${96 + droop}) scale(${s}) translate(-60,-96)">${body}</g>
    </g>
    ${moodCue(moodId)}`;
}

// Small helper so art doesn't need to import the whole pet system
function petStageLevel(pet) {
  const stage = pet.stage;
  const byStage = { hatchling: 1, juvenile: 8, adult: 20, elder: 45 };
  return byStage[stage] ?? 1;
}

/** A compact portrait for roster tiles. */
export function petPortrait(pet, moodId, size = 96) {
  return `
    <svg viewBox="0 0 120 120" width="${size}" height="${size}" class="pet-svg">
      ${petArt(pet, moodId)}
    </svg>`;
}

export function eggPortrait(speciesId, pct, size = 96) {
  return `
    <svg viewBox="0 0 120 120" width="${size}" height="${size}" class="pet-svg">
      ${eggArt(speciesId, pct)}
    </svg>`;
}
