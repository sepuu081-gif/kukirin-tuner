import { Capacitor, registerPlugin } from '@capacitor/core';
const ads = registerPlugin('StartIoAds');
export const AD_REWARD = 500;
export const hasAndroidAds = () => Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('StartIoAds');
export const getAdsStatus = () => ads.getStatus();
export const configureAds = choices => ads.configure(choices);
let busy = false;
let recovery = null;
const respect = () => Math.max(0, Number(localStorage.getItem('kukirin_respect')) || 0);
// A saved transaction lets recovery finish the wallet write if the app closes
// between recording the native receipt and updating the existing REP wallet.
export function applyAdReceipt(id) {
  if (!/^[a-f\d-]{36}$/i.test(id)) return 0;
  const transaction = JSON.parse(localStorage.getItem('kukirin_ad_transaction') || 'null');
  if (transaction) {
    localStorage.setItem('kukirin_respect', String(Math.max(respect(), transaction.balance)));
    localStorage.setItem('kukirin_ad_paid_' + transaction.id, 'true');
    localStorage.removeItem('kukirin_ad_transaction');
  }
  if (localStorage.getItem('kukirin_ad_paid_' + id) === 'true') return 0;
  const balance = respect() + AD_REWARD;
  localStorage.setItem('kukirin_ad_transaction', JSON.stringify({ id, balance }));
  localStorage.setItem('kukirin_respect', String(balance));
  localStorage.setItem('kukirin_ad_paid_' + id, 'true');
  localStorage.removeItem('kukirin_ad_transaction');
  window.dispatchEvent(new Event('kukirin:rep-updated'));
  return AD_REWARD;
}
export async function recoverAdRewards() {
  if (!hasAndroidAds()) return 0;
  if (recovery) return recovery;
  recovery = (async () => {
    const result = await ads.getPendingRewards();
    let reward = 0;
    for (const id of result.ids || []) { reward += applyAdReceipt(id); await ads.acknowledgeReward({ id }); }
    return reward;
  })();
  try { return await recovery; } finally { recovery = null; }
}
export async function watchRewardedAd() {
  if (!hasAndroidAds()) throw new Error('ANDROID_ONLY');
  if (!navigator.onLine) throw new Error('OFFLINE');
  if (busy) throw new Error('BUSY');
  busy = true;
  try {
    const result = await ads.showRewarded();
    const reward = await recoverAdRewards();
    return { completed: result.completed, reward };
  } finally { busy = false; }
}
