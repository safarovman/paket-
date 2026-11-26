import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:     "#070505",
        panel:  "#130C0C",
        panel2: "#1D1313",
        line:   "#2F1E1E",
        muted:  "#A89494",
        accent: { DEFAULT: "#FFC83D", dark: "#F0A800" },
        violet: { DEFAULT: "#DC2626", light: "#FF6B6B" },
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
