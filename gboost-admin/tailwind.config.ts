import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg:      "#0A0F1E",
        card:    "#111827",
        border:  "#1F2937",
        cyan:    "#00E5FF",
        purple:  "#7C3AED",
        gold:    "#F59E0B",
        green:   "#10B981",
        red:     "#EF4444",
        orange:  "#F97316",
        "text-white": "#F9FAFB",
        "text-gray":  "#6B7280",
        "text-light": "#E5E7EB",
      },
    },
  },
  plugins: [],
};
export default config;
