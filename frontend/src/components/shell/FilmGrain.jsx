import React from "react";

/**
 * Persistent film-grain overlay. Sits above content, ignores pointer events.
 */
export function FilmGrain() {
  return <div className="apu-grain" aria-hidden="true" />;
}
