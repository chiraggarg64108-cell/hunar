/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'hunar-blue': '#0A3A60',
        'hunar-navy': '#062338',
        'hunar-teal': '#0D9488',
        'hunar-cyan': '#06B6D4',
        'hunar-green': '#16A34A',
        'hunar-gold': '#D97706',
        'hunar-light': '#F0F9FF',
        'dark-bg': '#0B1120',
        'dark-card': '#1E293B',
        'dark-border': '#334155',
        'dark-muted': '#94A3B8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'card-dark': '0 4px 24px -2px rgba(0, 0, 0, 0.45)',
        'glow-teal': '0 0 24px -4px rgba(13, 148, 136, 0.4)',
      }
    },
  },
  plugins: [],
}
