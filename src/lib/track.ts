// Thin wrapper around Google Analytics 4 (gtag is loaded in app/layout.tsx).
// Never pass personal data (emails, names, team IDs) as params.

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event", name: string, params?: Params) => void;
  }
}

export function track(event: string, params?: Params) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", event, params);
  } catch {
    /* analytics must never break the app */
  }
}
