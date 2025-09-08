/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'income': '#10b981',
        'expense': '#ef4444', 
        'investment': '#3b82f6',
        'withdraw': '#f59e0b'
      }
    },
  },
  plugins: [],
}