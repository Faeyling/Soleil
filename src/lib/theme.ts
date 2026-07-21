export type Theme = "clair" | "sombre" | "systeme";

const CLE_THEME = "soleil-theme";

const requetePrefereSombre = () => window.matchMedia("(prefers-color-scheme: dark)");

export function getThemePreference(): Theme {
  const brut = localStorage.getItem(CLE_THEME);
  return brut === "clair" || brut === "sombre" ? brut : "systeme";
}

function themeEffectif(preference: Theme): "clair" | "sombre" {
  if (preference !== "systeme") return preference;
  return requetePrefereSombre().matches ? "sombre" : "clair";
}

function appliquer(theme: "clair" | "sombre"): void {
  document.documentElement.setAttribute("data-theme", theme === "sombre" ? "dark" : "light");
}

export function setThemePreference(preference: Theme): void {
  if (preference === "systeme") {
    localStorage.removeItem(CLE_THEME);
  } else {
    localStorage.setItem(CLE_THEME, preference);
  }
  appliquer(themeEffectif(preference));
}

let ecouteurInstalle = false;

/** À appeler une fois au démarrage : applique le thème courant et suit les changements système si "systeme" est actif. */
export function initTheme(): void {
  appliquer(themeEffectif(getThemePreference()));

  if (ecouteurInstalle) return;
  ecouteurInstalle = true;
  requetePrefereSombre().addEventListener("change", () => {
    if (getThemePreference() === "systeme") {
      appliquer(themeEffectif("systeme"));
    }
  });
}
