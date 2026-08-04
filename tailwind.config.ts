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
        // FiraGO covers both Latin and Georgian in a single font file
        // (self-hosted via @fontsource/firago, loaded in [locale]/layout.tsx).
        // System-ui fallbacks are for the brief FOUT window under
        // display: 'swap' before the woff2 arrives.
        sans: [
          'var(--font-firago)',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        // Alias — historical markup uses `font-firago`; keep it pointing at
        // the same family so existing classes stay meaningful.
        firago: [
          'var(--font-firago)',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
export default config
