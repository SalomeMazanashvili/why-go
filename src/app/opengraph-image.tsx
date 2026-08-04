import { ImageResponse } from 'next/og'

// WHY-69: site-wide OG fallback. Latin/brand mark only — no Georgian
// glyphs because satori needs TTF/OTF fonts and @fontsource/firago ships
// woff2 only. Per-tour dynamic OG with Georgian typography lives in the
// follow-up ticket (checks in a subsetted FiraGO TTF).

export const runtime = 'edge'
export const alt = 'Why Go — boutique tours built around real skills'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0a0a0a',
          padding: 80,
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Yellow accent bar top-right */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 24,
            height: '100%',
            background: '#FFCC00',
          }}
        />

        {/* Grid lines background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(255,204,0,0.06) 80px),repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(255,204,0,0.06) 80px)',
          }}
        />

        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, zIndex: 1 }}>
          <span style={{ fontSize: 140, fontWeight: 900, letterSpacing: '-0.04em' }}>WHY</span>
          <span style={{ fontSize: 140, fontWeight: 900, letterSpacing: '-0.04em', color: '#FFCC00' }}>GO</span>
        </div>

        {/* Tagline (English only for now — see file header) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1 }}>
          <div
            style={{
              fontSize: 20,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#FFCC00',
              fontWeight: 700,
            }}
          >
            Experience · Development · Travel
          </div>
          <div style={{ fontSize: 32, fontWeight: 400, color: 'rgba(255,255,255,0.6)', maxWidth: 800 }}>
            Boutique tours built around language, sport, and culinary skills.
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
