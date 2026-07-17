/**
 * Ayesha-only photo pool ("ayesha only" folder) — used exclusively by the
 * /ayesha editorial gallery, kept separate from the shared couple-photo
 * pool in realAssets.js so her page always draws from her own set.
 */
const AYESHA_ONLY_COUNT = 24;

export const AYESHA_ONLY_PHOTOS = Array.from(
  { length: AYESHA_ONLY_COUNT },
  (_, i) => `/assets/ayesha-only/ayesha-${String(i + 1).padStart(2, "0")}.jpeg`
);

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function photoForAyeshaAssetId(assetId) {
  if (!assetId) return null;
  const idx = hashString(String(assetId)) % AYESHA_ONLY_PHOTOS.length;
  return AYESHA_ONLY_PHOTOS[idx];
}
