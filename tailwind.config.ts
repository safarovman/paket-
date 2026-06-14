import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:       "#0D0D1A",
        card:     "#161D38",
        border:   "#1A2245",
        navy:     "#131929",
        cyan:     "#00E5FF",
        purple:   "#6C3FB5",
        "purple-light": "#9B59B6",
        gold:     "#FFD600",
        green:    "#00C853",
        red:      "#FF3D3D",
        orange:   "#FF8C00",
        "text-white":  "#FFFFFF",
        "text-light":  "#E8EAF6",
        "text-gray":   "#90A4AE",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6C3FB5, #00E5FF)",
        "gradient-gold":    "linear-gradient(135deg, #FFD600, #FF8C00)",
        "gradient-dark":    "linear-gradient(135deg, #161D38, #0D0D1A)",
      },
      animation: {
        "fade-in":    "fadeIn 0.5s ease-in-out",
        "slide-up":   "slideUp 0.4s ease-out",
        "pulse-glow": "pulseGlow 2s infinite",
        "float":      "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:   { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pulseGlow: { "0%,100%": { boxShadow: "0 0 10px #00E5FF44" }, "50%": { boxShadow: "0 0 30px #00E5FF88" } },
        float:     { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      boxShadow: {
        cyan:   "0 0 20px rgba(0,229,255,0.25)",
        purple: "0 0 20px rgba(108,63,181,0.25)",
        gold:   "0 0 20px rgba(255,214,0,0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
