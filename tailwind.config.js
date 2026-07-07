// Semantic colors are CSS variables (see index.css) so light/dark switch
// instantly without per-component `dark:` variants. Format is "R G B" channels
// consumed as rgb(var(--x) / <alpha-value>) so opacity utilities still work.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Poppins", "system-ui", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        bg: v("--c-bg"),
        surface: v("--c-surface"),
        surface2: v("--c-surface2"),
        surface3: v("--c-surface3"),
        line: v("--c-line"),
        ink: v("--c-ink"),
        ink2: v("--c-ink2"),
        muted: v("--c-muted"),
        brand: v("--c-brand"),
        brandHover: v("--c-brand-hover"),
        brandSoft: v("--c-brand-soft"),
        meet: v("--c-brand"),
        meetHover: v("--c-brand-hover"),
        stream: v("--c-stream"),
        streamHover: v("--c-stream-hover"),
        live: v("--c-live"),
        liveHover: v("--c-live-hover"),
        success: v("--c-success"),

        // Legacy fixed keys (rarely used)
        darkBlue1: "#1c1f2e",
        darkBlue2: "#171925",
        lightGray: "#242736",
        gray: "#2e323e",
        blue: "#4f46e5",
        yellow: "#ff742f",
        lightYellow: "#ff884c",
        red: "#f0445d",
      },
      borderRadius: { "2xl": "1rem", "3xl": "1.5rem" },
      boxShadow: {
        card: "0 1px 2px rgba(8,10,20,0.06), 0 8px 24px rgba(8,10,20,0.10)",
        float: "0 8px 30px rgba(8,10,20,0.18)",
      },
      keyframes: {
        pulseLive: { "0%, 100%": { opacity: 1 }, "50%": { opacity: 0.4 } },
      },
      animation: { pulseLive: "pulseLive 1.4s ease-in-out infinite" },
    },
  },
  plugins: [],
};
