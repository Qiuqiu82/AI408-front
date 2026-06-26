/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
