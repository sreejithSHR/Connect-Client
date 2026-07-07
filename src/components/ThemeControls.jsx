import React, { useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

// Reusable theme + background editor (used in the header menu and meeting settings).
const ThemeControls = () => {
  const { theme, toggleTheme, bgId, setBackground, setCustomBackground, backgrounds } = useTheme();
  const [custom, setCustom] = useState("");

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-ink2">Appearance</span>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 rounded-full bg-surface2 px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface3"
        >
          {theme === "dark" ? <FiMoon /> : <FiSun />}
          {theme === "dark" ? "Dark" : "Light"}
        </button>
      </div>

      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Background</p>
      <div className="grid grid-cols-4 gap-2">
        {backgrounds.map((b) => (
          <button
            key={b.id}
            title={b.name}
            onClick={() => setBackground(b.id)}
            style={{ background: b.value }}
            className={`h-12 rounded-xl border-2 transition-transform hover:scale-105 ${
              bgId === b.id ? "border-brand" : "border-transparent"
            }`}
          />
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Custom CSS bg or image url(...)"
          className="flex-1 rounded-lg border border-line bg-surface2 px-3 py-2 text-xs text-ink outline-none focus:ring-2 focus:ring-brand"
        />
        <button
          onClick={() => custom.trim() && setCustomBackground(custom.trim())}
          className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brandHover"
        >
          Set
        </button>
      </div>
      <p className="mt-1 text-[11px] text-muted">
        e.g. <code>linear-gradient(135deg,#111,#333)</code> or <code>url(https://…jpg)</code>
      </p>
    </div>
  );
};

export default ThemeControls;
