/* Tailwind preset for the redesign. Keeps the `app-*` colour names the live app already uses, and collapses the
   type and radius scales so old classes land on the new steps (DS-01, DS-02).
   Usage: module.exports = { presets: [require("./tailwind.preset.js")], ... } */
const rgb = v => `rgb(var(--${v}) / <alpha-value>)`;
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        app: {
          bg: rgb("color-app-bg"), card: rgb("color-app-card"),
          text: { DEFAULT: rgb("color-app-text"), secondary: rgb("color-app-text-secondary"), tertiary: rgb("color-app-text-tertiary") },
          border: { DEFAULT: rgb("color-app-border"), strong: rgb("color-app-border-strong"), input: rgb("color-app-border-input") },
          accent: { DEFAULT: rgb("color-app-accent"), soft: rgb("color-app-accent-soft"), fill: rgb("color-app-accent-fill"),
            strong: rgb("color-app-accent-strong"), solid: rgb("color-app-accent-solid"), text: rgb("color-app-accent-text") },
          success: rgb("color-app-success"), warning: rgb("color-app-warning"), danger: rgb("color-app-danger"),
          second: { DEFAULT: rgb("color-app-second"), soft: rgb("color-app-second-soft") },
          attention: rgb("app-attention-surface"),
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      /* Seven sizes. 10, 15 and 18 px no longer exist; old classes fall onto the nearest step. */
      fontSize: {
        "2xs": ["12px", "16px"], xs: ["12px", "18px"], sm: ["13px", "20px"], base: ["14px", "21px"],
        md: ["16px", "24px"], lg: ["16px", "24px"], xl: ["20px", "26px"], "2xl": ["20px", "26px"], "3xl": ["28px", "34px"],
      },
      /* Three radii by size, plus full for avatars, dots and the switch track. */
      borderRadius: { sm: "4px", DEFAULT: "6px", md: "6px", lg: "10px", xl: "10px", "2xl": "10px", "3xl": "10px", full: "9999px" },
      boxShadow: { sm: "var(--shadow-1)", DEFAULT: "var(--shadow-1)", md: "var(--shadow-2)", lg: "var(--shadow-3)", xl: "var(--shadow-3)" },
      transitionTimingFunction: { out: "cubic-bezier(.16,1,.3,1)" },
      accentColor: { DEFAULT: "var(--accent)" },
    },
  },
};
