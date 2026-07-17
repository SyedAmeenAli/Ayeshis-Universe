/**
 * Registers the offline app-shell service worker in production builds only.
 * Deliberately skipped in development — a SW intercepting fetches would
 * fight webpack-dev-server's HMR and hot-reload requests.
 */
export function register() {
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .catch(() => {
        // Offline shell is a nice-to-have, never block the app on it.
      });
  });
}

export function unregister() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then((registration) => registration.unregister()).catch(() => {});
}
