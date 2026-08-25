// AdCap-style number formatting: 1.23K, 45.6M, 7.89B, then aa/ab/ac...
const TIERS = ['', 'K', 'M', 'B', 'T', 'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah'];

export function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '0';
  if (n < 0) return '-' + fmt(-n);
  if (n < 1000) return n < 100 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toString();
  let tier = Math.floor(Math.log10(n) / 3);
  if (tier >= TIERS.length) tier = TIERS.length - 1;
  const scaled = n / Math.pow(10, tier * 3);
  return (scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)) + TIERS[tier];
}

export function fmtInt(n) {
  return Math.floor(n).toLocaleString('en-US');
}

// 90 -> "1m 30s", 4000 -> "1h 6m"
export function fmtDuration(seconds) {
  seconds = Math.floor(seconds);
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60) % 60;
  const h = Math.floor(seconds / 3600) % 24;
  const d = Math.floor(seconds / 86400);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (!d && !h) parts.push(`${seconds % 60}s`);
  return parts.join(' ');
}

export function fmtTime(ms) {
  return (ms / 1000).toFixed(1) + 's';
}
