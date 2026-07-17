import { useCallback, useEffect, useState } from "react";
import { fetchGalleryReactions, reactToGalleryItem } from "@/lib/galleryApi";

/**
 * Loads + mutates per-item reactions (favourite / rating) for a gallery.
 * Optimistic: UI updates immediately, backend call fires in the background.
 */
export function useGalleryReactions(gallery) {
  const [reactions, setReactions] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchGalleryReactions(gallery)
      .then((data) => {
        if (!cancelled) setReactions(data || {});
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [gallery]);

  const react = useCallback(
    (itemId, payload) => {
      setReactions((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], ...payload },
      }));
      reactToGalleryItem(gallery, itemId, payload).catch(() => {});
    },
    [gallery]
  );

  return { reactions, react, loaded };
}
