/**
 * Real personal photos dropped into public/assets/real/.
 * Every AssetPlaceholder deterministically picks one of these by hashing
 * its asset_id, so the same placeholder always resolves to the same photo.
 */
export const REAL_PHOTO_COUNT = 23;

export const REAL_PHOTOS = Array.from(
  { length: REAL_PHOTO_COUNT },
  (_, i) => `/assets/real/photo-${String(i + 1).padStart(2, "0")}.jpeg`
);

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function photoForAssetId(assetId) {
  if (!assetId) return null;
  const idx = hashString(String(assetId)) % REAL_PHOTOS.length;
  return REAL_PHOTOS[idx];
}
