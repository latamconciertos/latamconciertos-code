import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#141413",
          dark: "#0F0F0E",
        },
        secondary: {
          DEFAULT: "#828179",
          dark: "#646461",
        },
        accent: {
          DEFAULT: "#ea384c",
          dark: "#c42e3e",
        },
        background: {
          DEFAULT: "#FAFAF8",
          dark: "#000000",
        },
        surface: {
          DEFAULT: "#fff",
          dark: "#111111",
        },
        muted: {
          DEFAULT: "#C4C3BB",
          dark: "#403E43",
        },
        "muted-foreground": {
          DEFAULT: "#A3A299",
          dark: "#666666",
        },
        border: {
          DEFAULT: "#E6E4DD",
          dark: "#333333",
        },
        input: {
          DEFAULT: "#F0EFEA",
          dark: "#2A2A2A",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      textColor: {
        foreground: {
          DEFAULT: "#141413",
          dark: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["SF Pro Display", "system-ui", "sans-serif"],
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;