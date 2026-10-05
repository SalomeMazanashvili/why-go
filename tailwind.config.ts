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
        // Brand colours from the logo rules v2 (WHY-99). Yellow takes ink
        // text only — never white or paper on yellow (1.5:1, banned).
        'brand-yellow': '#FCCC01',
        ink: '#111110',
        paper: '#F5F5F0',
        // Surface tokens (globals.css .surface-light / .surface-dark)
        fg: 'var(--fg)',
        muted: 'var(--fg-muted)',
        line: 'var(--line)',
        accent: 'var(--accent-text)',
        surface: 'var(--surface)',
        raised: 'var(--surface-raised)',
        danger: 'var(--danger)',
        field: 'var(--field-border)',
      },
      fontFamily: {
        // FiraGO covers both Latin and Georgian in a single font file
        // (subset by scripts/subset-fonts.sh, loaded in [locale]/layout.tsx).
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
