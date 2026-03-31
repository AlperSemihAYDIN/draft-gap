/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Özel renk paleti — LoL teması
        'lol-gold': '#C89B3C',
        'lol-blue': '#0AC8B9',
        'lol-dark': '#0A1428',
        'lol-darker': '#061018',
        'lol-gray': '#1E2328',
        'lol-light': '#A09B8C',
        'lol-red': '#E84057',
      },
      fontFamily: {
        display: ['Beaufort', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
