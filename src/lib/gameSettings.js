const KEY = 'kukirin_game_settings';

export function getGameSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { damageEnabled: saved.damageEnabled !== false };
  } catch {
    return { damageEnabled: true };
  }
}

export function saveGameSettings(settings) {
  const next = { ...getGameSettings(), ...settings };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('kukirin:settings'));
  return next;
}

export function damageEnabled() { return getGameSettings().damageEnabled; }
