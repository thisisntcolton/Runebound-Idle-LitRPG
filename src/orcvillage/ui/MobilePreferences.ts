type Mode = 'Auto' | 'Desktop' | 'Mobile';
const KEY = 'orc-display-preferences';
export function installMobilePreferences() {
  let mode: Mode = 'Auto', size = 100, opacity = 85;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    if (['Auto','Desktop','Mobile'].includes(saved.mode)) mode = saved.mode;
    if (Number.isFinite(saved.size)) size = Math.max(75, Math.min(125, saved.size));
    if (Number.isFinite(saved.opacity)) opacity = Math.max(40, Math.min(100, saved.opacity));
  } catch { /* Preferences are optional. */ }
  const options = document.querySelector<HTMLElement>('.orc-tools');
  const panel = document.createElement('div');
  panel.className = 'orc-display-settings';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Display layout');
  for (const value of ['Auto','Desktop','Mobile'] as Mode[]) {
    const option = document.createElement('option'); option.value = value; option.textContent = value; select.append(option);
  }
  select.value = mode;
  const makeRange = (label: string, min: number, max: number, value: number) => {
    const wrapper = document.createElement('label'); wrapper.textContent = label;
    const input = document.createElement('input'); input.type = 'range'; input.min = String(min); input.max = String(max); input.value = String(value); input.setAttribute('aria-label', label); wrapper.append(input); panel.append(wrapper); return input;
  };
  const layoutLabel = document.createElement('label'); layoutLabel.textContent = 'Layout'; layoutLabel.append(select); panel.append(layoutLabel);
  const sizeInput = makeRange('Control size', 75, 125, size);
  const opacityInput = makeRange('Control opacity', 40, 100, opacity);
  options?.append(panel);
  const coarse = matchMedia('(any-pointer: coarse)');
  const apply = () => {
    const mobile = mode === 'Mobile' || (mode === 'Auto' && coarse.matches && Math.min(innerWidth, innerHeight) < 900);
    document.body.classList.toggle('orc-mobile', mobile);
    document.documentElement.style.setProperty('--orc-control-scale', String(size / 100));
    document.documentElement.style.setProperty('--orc-control-opacity', String(opacity / 100));
  };
  const change = () => {
    mode = select.value as Mode; size = Number(sizeInput.value); opacity = Number(opacityInput.value); apply();
    try { localStorage.setItem(KEY, JSON.stringify({mode,size,opacity})); } catch { /* Continue without persisted preferences. */ }
    window.dispatchEvent(new Event('orc-layout-change')); window.dispatchEvent(new Event('resize'));
  };
  select.addEventListener('change', change); sizeInput.addEventListener('input', change); opacityInput.addEventListener('input', change);
  const resize = () => apply(); window.addEventListener('resize', resize); coarse.addEventListener('change', resize); apply();
  return () => { window.removeEventListener('resize', resize); coarse.removeEventListener('change', resize); panel.remove(); };
}
