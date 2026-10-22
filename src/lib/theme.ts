export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "mm-theme";

// O tema escuro é o padrão (identidade original); o claro é opt-in e persistido.
export const DEFAULT_THEME: Theme = "dark";

// Executado no <head> antes da pintura para evitar o "flash" do tema errado.
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");document.documentElement.classList.toggle("dark",(t==="light"||t==="dark"?t:"${DEFAULT_THEME}")==="dark")}catch(e){}})();`;

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Armazenamento indisponível: o tema vale só para esta página.
  }
}
