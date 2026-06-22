module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Poppins", "system-ui", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        // Light design system (matches the reference UI)
        bg: "#e9ebf1", // app background (outside the cards)
        surface: "#ffffff", // cards / panels
        surface2: "#f4f5f8", // inputs, thumbnails, subtle fills
        surface3: "#eaecf2", // hover / raised
        line: "#e8eaf1", // hairline borders
        ink: "#1a1d24", // primary text
        ink2: "#3d424d", // secondary-strong text
        muted: "#8a909c", // secondary text

        brand: "#4f46e5", // indigo primary (meetings)
        brandHover: "#4338ca",
        brandSoft: "#eef0fe", // tinted background for active states
        meet: "#4f46e5",
        meetHover: "#4338ca",
        stream: "#9147ff", // streaming accent
        streamHover: "#772ce8",
        live: "#f0445d", // end-call / live red
        liveHover: "#e02d4d",
        success: "#16b364",

        // Legacy keys kept so nothing breaks
        darkBlue1: "#1c1f2e",
        darkBlue2: "#171925",
        lightGray: "#242736",
        gray: "#2e323e",
        blue: "#4f46e5",
        yellow: "#ff742f",
        lightYellow: "#ff884c",
        red: "#f0445d",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px rgba(16,24,40,0.06)",
        float: "0 8px 30px rgba(16,24,40,0.12)",
      },
      keyframes: {
        pulseLive: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.4 },
        },
      },
      animation: {
        pulseLive: "pulseLive 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
