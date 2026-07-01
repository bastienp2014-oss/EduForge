/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
    '../src/components/**/*.{js,jsx,ts,tsx}',
    '../src/features/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--theme-primary)',
        background: 'var(--theme-bg)'
      },
      fontFamily: {
        sans: ['var(--theme-font)', 'sans-serif']
      }
    },
  },
  plugins: [],
}
