/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: '#0B0C10',
        surface: '#111827',
        elevated: '#1F2937',
        border: '#374151',
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        highlight: '#FACC15',
      }
    },
  },
  plugins: [],
}
