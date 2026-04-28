import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-yellow': '#FFCC00',
        'brand-black': '#000000',
        'brand-white': '#FFFFFF',
        'brand-gray': '#111111',
      },
      fontFamily: {
        sans: ['var(--font-montserrat)', 'Montserrat', 'sans-serif'],
        firago: ['FiraGO', 'Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
