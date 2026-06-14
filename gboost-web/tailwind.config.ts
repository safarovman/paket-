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
        bg:      "#0E0E0E",
        card:    "#1A1A1A",
        card2:   "#222222",
        border:  "#2A2A2A",
        orange:  { DEFAULT:"#FF6B00", light:"#FF9A3C", dark:"#E55A00" },
        "text-white": "#F0F0F0",
        "text-gray":  "#888888",
        "text-light": "#C0C0C0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in":  "fadeIn 0.4s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "float":    "float 3s ease-in-out infinite",
        "pulse-orange": "pulseOrange 2s infinite",
      },
      keyframes: {
        fadeIn:       { "0%":{ opacity:"0" }, "100%":{ opacity:"1" } },
        slideUp:      { "0%":{ opacity:"0", transform:"translateY(16px)" }, "100%":{ opacity:"1", transform:"translateY(0)" } },
        float:        { "0%,100%":{ transform:"translateY(0)" }, "50%":{ transform:"translateY(-6px)" } },
        pulseOrange:  { "0%,100%":{ boxShadow:"0 0 0 0 rgba(255,107,0,0.4)" }, "50%":{ boxShadow:"0 0 0 10px rgba(255,107,0,0)" } },
      },
    },
  },
  plugins: [],
};

export default config;
