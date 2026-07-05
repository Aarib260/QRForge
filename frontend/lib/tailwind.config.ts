import type {Config} from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
        colors: {
            soot: "#14120F",
            plate: "#1C1A16",
            steel: "#2A2D31",
            steelLight: "#3A3F44",
            bone: "#F2EFE9",
            ember: "#FF6B35",
            amber: "#FFB627",
        },
        fontFamily: {
            display: ["var(--font-space-grotesk)", "sans-sarif"],
            body: ["var(--font-inter)", "sans-sarif"],
            mono: ["var(--font-jetbrains-mono)", "monospace"],
        },
        boxShadow: {
            ember: "0 0 40px -8px rgba(255, 107, 53, 0.45)",
        },
        keyframes: {
           glow: {
            "0%": { boxShadow: "0 0 0px rgba(255,107,53,0.0)"},
            "40%": { boxShadow: "0 0 60px 4px rgba(255,107,53,0.45)"},
            "100%": { boxShadow: "0 0 0px 0px rgba(255,107,53,0.0)"},
           },
        },
        animation: {
            glow: "glow 1.1s ease-out",
        },
    },
  },
  plugins: [],
};
export default config;