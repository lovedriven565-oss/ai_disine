/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#0b1326',
        primary: '#adc6ff',
        background: '#0b1326',
        'on-surface': '#dae2fd',
        'on-background': '#dae2fd',
        'surface-variant': '#2d3449',
        'on-surface-variant': '#c2c6d6',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        tertiary: '#bcc7de',
        'primary-container': '#4d8eff',
        outline: '#8c909f',
      },
      fontFamily: {
        'body-lg': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'label-caps': ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
