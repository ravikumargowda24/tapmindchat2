import { heroui } from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    './src/layouts/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins'],
      },
      colors: {
        primary: '#fe5f00',
        'primary-hover': '#ffefe5',
        'background-dark': '#1c1d25',
        'light-purple': '#ffefe5',
        violet: '#fe5f00',
        avatar: {
          pink: '#ff006e',
          yellow: '#ffd60a',
          green: '#06d6a0',
          blue: '#4cc9f0',
        },
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
}
