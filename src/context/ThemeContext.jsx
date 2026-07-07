import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/**
 * Theme (light/dark) + editable app background. Backgrounds are premium dark/
 * light gradients (pure CSS — no external assets) chosen to remove flat white
 * space. Picking a background also aligns the theme so text contrast stays
 * correct. Everything persists to localStorage.
 */

export const BACKGROUNDS = [
  // dark
  { id: "midnight", name: "Midnight", dark: true, value: "linear-gradient(140deg,#0f0c29,#302b63,#24243e)" },
  { id: "aurora", name: "Aurora", dark: true, value: "linear-gradient(140deg,#0b1020,#0f2027,#203a43)" },
  { id: "plum", name: "Plum", dark: true, value: "linear-gradient(140deg,#1a0b2e,#2d1b4e,#0f0c29)" },
  { id: "ocean", name: "Deep Ocean", dark: true, value: "linear-gradient(160deg,#020111,#0a2342,#123c69)" },
  { id: "ember", name: "Ember", dark: true, value: "linear-gradient(140deg,#0d0d0d,#2b1a12,#3a1c1c)" },
  { id: "forest", name: "Forest", dark: true, value: "linear-gradient(140deg,#07130d,#132a1e,#1e3d2f)" },
  { id: "space", name: "Deep Space", dark: true, value: "radial-gradient(900px 600px at 15% -10%,#1b1436,transparent 55%),radial-gradient(800px 600px at 110% 10%,#10233f,transparent 50%),linear-gradient(140deg,#0c0c10,#111018)" },
  // light
  { id: "cloud", name: "Cloud", dark: false, value: "linear-gradient(140deg,#eef1f8,#e2e7f3)" },
  { id: "mist", name: "Mist", dark: false, value: "linear-gradient(160deg,#f2f4fa,#e6ebf6)" },
  { id: "blush", name: "Blush", dark: false, value: "linear-gradient(140deg,#f6f0f7,#eef1fb)" },
];

const DEFAULT_DARK_BG = "space";
const DEFAULT_LIGHT_BG = "cloud";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => localStorage.getItem("connect.theme") || "dark");
  const [bgId, setBgId] = useState(
    () => localStorage.getItem("connect.bg") || DEFAULT_DARK_BG
  );
  const [customBg, setCustomBg] = useState(
    () => localStorage.getItem("connect.customBg") || ""
  );

  const resolvedBg = useMemo(() => {
    if (bgId === "custom" && customBg) return customBg;
    const preset = BACKGROUNDS.find((b) => b.id === bgId);
    return preset ? preset.value : null;
  }, [bgId, customBg]);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    if (resolvedBg) root.style.setProperty("--app-bg", resolvedBg);
    else root.style.removeProperty("--app-bg");
    localStorage.setItem("connect.theme", theme);
    localStorage.setItem("connect.bg", bgId);
    if (customBg) localStorage.setItem("connect.customBg", customBg);
  }, [theme, bgId, resolvedBg, customBg]);

  const setTheme = (t) => {
    setThemeState(t);
    // Move to a matching default background if the current one clashes.
    const preset = BACKGROUNDS.find((b) => b.id === bgId);
    if (bgId === "custom") return;
    if (preset && preset.dark !== (t === "dark")) {
      setBgId(t === "dark" ? DEFAULT_DARK_BG : DEFAULT_LIGHT_BG);
    }
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  const setBackground = (id) => {
    setBgId(id);
    const preset = BACKGROUNDS.find((b) => b.id === id);
    if (preset) setThemeState(preset.dark ? "dark" : "light");
  };

  const setCustomBackground = (value) => {
    setCustomBg(value);
    setBgId("custom");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme, setTheme, toggleTheme,
        bgId, setBackground, customBg, setCustomBackground,
        backgrounds: BACKGROUNDS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
