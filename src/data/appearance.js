// ============================================================
// APPEARANCE — the Mii-style hero builder
//
// Every option is an index into a list, so a whole character is a small
// bag of integers that survives migration, cloud sync and save export
// without any special handling. Adding a hairstyle never invalidates an
// existing save; it just appends to a list.
//
// Palettes are deliberately short. Twelve good skin tones beat a colour
// wheel: you get a character you like in ten seconds instead of fiddling
// with hex values, which is exactly the Mii trick.
// ============================================================

export const SKIN = [
  '#f6ddc6', '#eec8a6', '#e0ac81', '#c98d62',
  '#a9714a', '#8a5a3b', '#6b452d', '#4d3122',
  // and a few that are not strictly human, because this is a fantasy world
  '#cfe0d0', '#d6cbe8', '#bcd7e8', '#e8c9d4',
];

export const HAIR_COLOR = [
  '#2b2118', '#4a3a2a', '#6b4a2f', '#8c6239',
  '#b3873f', '#d9b45c', '#e8dcc0', '#9a9a9a',
  '#d94f4f', '#b04fd9', '#4f7fd9', '#3fae8a',
];

export const EYE_COLOR = [
  '#3a2a1a', '#5c3b1e', '#7a5a2a', '#4a7a4a',
  '#2f6b8a', '#4a5ab0', '#7a4aa0', '#a03a3a',
  '#2a2a33', '#8fdb6a',
];

export const CLOTH_COLOR = [
  '#3d5a8a', '#8a3d3d', '#3d8a5a', '#6b3d8a',
  '#8a6b3d', '#3d7f8a', '#8a3d6b', '#4a4a55',
  '#c9a24a', '#2f3a52', '#5a6b3d', '#7a3a2a',
];

// Each of these is drawn in ui/heroart.js and referenced by index.
export const HAIR_STYLES = [
  { id: 'crop',    name: 'Cropped' },
  { id: 'swept',   name: 'Swept' },
  { id: 'long',    name: 'Long' },
  { id: 'ponytail',name: 'Ponytail' },
  { id: 'braids',  name: 'Braids' },
  { id: 'curls',   name: 'Curls' },
  { id: 'topknot', name: 'Topknot' },
  { id: 'mohawk',  name: 'Ridge' },
  { id: 'bald',    name: 'Shaved' },
  { id: 'hooded',  name: 'Hooded' },
];

export const EYE_SHAPES = [
  { id: 'round',   name: 'Round' },
  { id: 'sharp',   name: 'Sharp' },
  { id: 'sleepy',  name: 'Sleepy' },
  { id: 'wide',    name: 'Wide' },
  { id: 'stern',   name: 'Stern' },
  { id: 'kind',    name: 'Kind' },
];

export const BROWS = [
  { id: 'neutral', name: 'Neutral' },
  { id: 'raised',  name: 'Raised' },
  { id: 'furrow',  name: 'Furrowed' },
  { id: 'thin',    name: 'Thin' },
  { id: 'thick',   name: 'Thick' },
];

export const MOUTHS = [
  { id: 'line',    name: 'Level' },
  { id: 'smile',   name: 'Smile' },
  { id: 'smirk',   name: 'Smirk' },
  { id: 'frown',   name: 'Frown' },
  { id: 'open',    name: 'Open' },
];

export const FACE_SHAPES = [
  { id: 'oval',    name: 'Oval',    rx: 30, ry: 34 },
  { id: 'round',   name: 'Round',   rx: 33, ry: 32 },
  { id: 'square',  name: 'Square',  rx: 31, ry: 31, square: true },
  { id: 'long',    name: 'Long',    rx: 27, ry: 37 },
  { id: 'heart',   name: 'Heart',   rx: 32, ry: 33, taper: true },
];

export const FACIAL_HAIR = [
  { id: 'none',    name: 'None' },
  { id: 'stubble', name: 'Stubble' },
  { id: 'goatee',  name: 'Goatee' },
  { id: 'full',    name: 'Full beard' },
  { id: 'moustache', name: 'Moustache' },
];

export const MARKS = [
  { id: 'none',    name: 'None' },
  { id: 'scar',    name: 'Scar' },
  { id: 'freckles',name: 'Freckles' },
  { id: 'warpaint',name: 'War paint' },
  { id: 'rune',    name: 'Rune brand' },
  { id: 'glasses', name: 'Spectacles' },
];

export const BUILDS = [
  { id: 'lean',    name: 'Lean',    shoulder: 0.86 },
  { id: 'average', name: 'Average', shoulder: 1.0 },
  { id: 'broad',   name: 'Broad',   shoulder: 1.18 },
];

/**
 * The full option registry, in the order the editor shows them.
 * `key` is the field on state.look; `list` is what it indexes into.
 */
export const OPTIONS = [
  { key: 'face',    label: 'Face shape',   list: FACE_SHAPES,  kind: 'shape' },
  { key: 'skin',    label: 'Skin',         list: SKIN,         kind: 'color' },
  { key: 'hair',    label: 'Hair',         list: HAIR_STYLES,  kind: 'shape' },
  { key: 'hairCol', label: 'Hair colour',  list: HAIR_COLOR,   kind: 'color' },
  { key: 'eyes',    label: 'Eyes',         list: EYE_SHAPES,   kind: 'shape' },
  { key: 'eyeCol',  label: 'Eye colour',   list: EYE_COLOR,    kind: 'color' },
  { key: 'brows',   label: 'Brows',        list: BROWS,        kind: 'shape' },
  { key: 'mouth',   label: 'Mouth',        list: MOUTHS,       kind: 'shape' },
  { key: 'beard',   label: 'Facial hair',  list: FACIAL_HAIR,  kind: 'shape' },
  { key: 'mark',    label: 'Features',     list: MARKS,        kind: 'shape' },
  { key: 'build',   label: 'Build',        list: BUILDS,       kind: 'shape' },
  { key: 'cloth',   label: 'Colours',      list: CLOTH_COLOR,  kind: 'color' },
];

export function defaultLook() {
  return {
    face: 0, skin: 1, hair: 0, hairCol: 0, eyes: 0, eyeCol: 0,
    brows: 0, mouth: 0, beard: 0, mark: 0, build: 1, cloth: 0,
    name: null,
  };
}

/** Clamp every field into range — a save from an older build may be short. */
export function normalizeLook(look) {
  const out = { ...defaultLook(), ...(look || {}) };
  for (const opt of OPTIONS) {
    const n = opt.list.length;
    const v = Number(out[opt.key]);
    out[opt.key] = Number.isFinite(v) ? ((v % n) + n) % n : 0;
  }
  return out;
}

export function randomLook(rng = Math.random) {
  const out = defaultLook();
  for (const opt of OPTIONS) out[opt.key] = Math.floor(rng() * opt.list.length);
  return out;
}
