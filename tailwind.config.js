/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#A78BFA',
      },
      borderRadius: {
        'custom': '16px',
      },
    },
  },
  plugins: [],
}

