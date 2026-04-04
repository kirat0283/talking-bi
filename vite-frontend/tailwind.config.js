/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#111827', // Tailwind gray-900
          surface: '#1E293B', // Tailwind slate-800
          border: '#334155', // Tailwind slate-700
          primary: '#3B82F6', // Tailwind blue-500
          secondary: '#8B5CF6' // Tailwind violet-500
        }
      }
    },
  },
  plugins: [],
}
