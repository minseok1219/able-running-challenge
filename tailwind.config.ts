import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#132238",
        accent: "#e85d04",
        mist: "#eef4f7",
        mint: "#d9f4ea",
        sand: "#fff5e8"
      },
      boxShadow: {
        panel: "0 18px 40px rgba(19, 34, 56, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
