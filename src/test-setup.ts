import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

// jsdom n'implémente pas window.matchMedia — nécessaire pour src/lib/theme.ts.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
