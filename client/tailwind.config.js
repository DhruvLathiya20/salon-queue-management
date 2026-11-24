/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        salon: {
          dark: '#1F2937',      // Primary Charcoal slate
          darker: '#111827',    // Deep card midnight
          surface: '#374151',   // Elevation surface
          card: '#182232',      // Secondary surface
          gold: '#D4A017',      // Primary Luxury Gold
          goldHover: '#B8860B', // Darker gold for interaction
          goldLight: '#F3E5AB', // Soft gold accent
          textPrimary: '#FFFFFF',
          textSecondary: '#E5E7EB',
          textMuted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 20px -3px rgba(212, 160, 23, 0.35)',
        'card-dark': '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};
