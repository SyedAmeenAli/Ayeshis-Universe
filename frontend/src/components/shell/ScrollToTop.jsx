import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * React Router doesn't reset scroll on navigation by default, so clicking
 * any nav link/card while scrolled down on the previous page landed you
 * mid-page or at the bottom of the new one. Force top-of-page on every
 * route change.
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
