import { apiGet, apiPost } from "@/lib/api";

export function fetchGalleryReactions(gallery) {
  return apiGet(`/gallery/${gallery}`);
}

export function reactToGalleryItem(gallery, itemId, payload) {
  return apiPost(`/gallery/${gallery}/${itemId}/react`, payload);
}

export function fetchAmeenGalleryStats() {
  return apiGet(`/gallery/ameen/stats`);
}
