import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:     "#050706",
        panel:  "#0C110E",
        panel2: "#131A16",
        line:   "#1E2A23",
        muted:  "#8A9B90",
        accent: { DEFAULT: "#5CFF8F", dark: "#34E070" },
        violet: { DEFAULT: "#16A34A", light: "#86EFAC" },
        win:    "#2BD67B",
        lose:   "#FF4D6A",
      },
      fontFamily: { sans: ["Montserrat", "system-ui", "sans-serif"] },
      animation: {
        "fade-in": "fadeIn .3s ease-out",
        "ticker-in": "tickerIn .5s ease-out",
        "glow": "glow 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:   { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        tickerIn: { "0%": { opacity: "0", transform: "translateX(-24px)" }, "100%": { opacity: "1", transform: "none" } },
        glow:     { "0%,100%": { opacity: ".55" }, "50%": { opacity: "1" } },
      },
    },
  },
  plugins: [],
};
export default config;
