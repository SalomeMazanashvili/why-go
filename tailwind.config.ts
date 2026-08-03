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
        // Character-cascade: Georgian glyphs render via Noto Sans Georgian;
        // Latin glyphs fall through to the system sans-serif. Keeps the site
        // Georgian-first without pulling a second webfont for Latin.
        sans: [
          'var(--font-georgian)',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        // `font-firago` classes stay as an alias so existing markup keeps
        // rendering Georgian. Nothing loads FiraGO now; the alias points at
        // the same Noto Sans Georgian variable.
        firago: [
          'var(--font-georgian)',
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
