export function trackPageView(path: string) {
  if (import.meta.env.VITE_ANALYTICS_ENABLED !== "true") return;

  window.dispatchEvent(
    new CustomEvent("devflow:pageview", {
      detail: { path },
    }),
  );
}
