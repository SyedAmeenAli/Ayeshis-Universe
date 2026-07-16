/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        ui: ["Manrope", "Inter", "system-ui", "sans-serif"],
        editorial: ['"Bodoni Moda"', '"Cormorant Garamond"', "serif"],
        hand: ["Caveat", "cursive"],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', "monospace"],
      },
      colors: {
        archive: {
          DEFAULT: "#0B0B0F",
          soft: "#0E0E13",
        },
        surface: {
          1: "#141419",
          2: "#1A1A21",
          3: "#22222B",
          4: "#2C2C37",
        },
        text: {
          primary: "#F7F4F6",
          secondary: "#B7B1BA",
          muted: "#7F7885",
        },
        kuromi: "#8B5CF6",
        lavender: {
          DEFAULT: "#B89CFF",
          soft: "#D1C2FF",
        },
        bow: "#F3A7C4",
        ivory: "#F8F0E7",
        tulip: "#FFF0F3",
        // shadcn compatibility
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
