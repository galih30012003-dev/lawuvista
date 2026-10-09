/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#d946ef',
          dark: '#c026d3',
          light: '#fae8ff',
          50: '#fdf4ff'
        },
        forest: {
          DEFAULT: '#701a75',
          dark: '#4a044e'
        },
        wa: {
          DEFAULT: '#25d366',
          dark: '#16a34a'
        },
        accent: {
          DEFAULT: '#f59e0b',
          dark: '#d97706'
        }
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};
