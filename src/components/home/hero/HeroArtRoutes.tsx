import { PLANE_HEADING_DEG, PlaneGlyph } from '@/components/brand/PlaneMark'

// WHY-79, direction B: route arcs. Dashed yellow flight paths with dots at
// their endpoints and the plane at the head of one, turned to its tangent.
//
// Unlike A and C this art is not a full-bleed layer: HomeHero gives it the
// free space *above* the text block (a flex-1 region), so a dash can never
// sit behind the headline, whatever its length or the viewport. A longer
// Georgian headline simply leaves the routes less room; they scale down
// (`meet`, never stretched, so dots stay round and the plane keeps its
// proportions). Two compositions: a phone band and a wide desktop band,
// right-aligned so the routes head off towards the top-right corner.

type Arc = { d: string; dots: Array<[number, number]> }
type Composition = {
  id: string
  viewBox: string
  align: string
  arcs: Arc[]
  plane: { x: number; y: number; from: [number, number]; size: number }
  className: string
}

// Rotation that turns the plane's own heading onto the arc's tangent at
// its head (from the quadratic's control point to the endpoint).
function planeRotation(from: [number, number], x: number, y: number) {
  const tangent = (Math.atan2(y - from[1], x - from[0]) * 180) / Math.PI
  return tangent - PLANE_HEADING_DEG
}

const PHONE: Composition = {
  id: 'hero-b-phone',
  viewBox: '0 0 400 240',
  align: 'xMidYMid meet',
  className: 'md:hidden',
  arcs: [
    { d: 'M 28 206 Q 200 196 318 74', dots: [[28, 206]] },
    { d: 'M 46 70 Q 210 -16 374 160', dots: [[46, 70], [374, 160]] },
  ],
  plane: { x: 318, y: 74, from: [200, 196], size: 72 },
}

const DESKTOP: Composition = {
  id: 'hero-b-desk',
  // A wide, short band: above a three-line headline the free space on a
  // laptop is only ~120px tall, and the routes should still span the width.
  viewBox: '0 0 1440 220',
  align: 'xMaxYMid meet',
  className: 'hidden md:block',
  arcs: [
    { d: 'M 700 200 Q 1000 196 1240 60', dots: [[700, 200]] },
    { d: 'M 120 70 Q 760 -40 1410 150', dots: [[120, 70], [1410, 150]] },
    { d: 'M 980 210 Q 1200 120 1430 180', dots: [[980, 210], [1430, 180]] },
  ],
  plane: { x: 1240, y: 60, from: [1000, 196], size: 100 },
}

function Routes({ c }: { c: Composition }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className={`absolute inset-0 w-full h-full pointer-events-none ${c.className}`}
      viewBox={c.viewBox}
      preserveAspectRatio={c.align}
    >
      <defs>
        {c.arcs.map((a, i) => (
          // Draws each dashed arc in once, in order (see .hero-draw).
          <mask key={i} id={`${c.id}-m${i}`} maskUnits="userSpaceOnUse">
            <path
              d={a.d}
              pathLength={1}
              stroke="#fff"
              strokeWidth="12"
              fill="none"
              strokeDasharray="1"
              className="hero-draw"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          </mask>
        ))}
      </defs>
      {c.arcs.map((a, i) => (
        <g key={i} mask={`url(#${c.id}-m${i})`}>
          <path d={a.d} fill="none" stroke="#FCCC01" strokeWidth="2" strokeDasharray="9 8" strokeOpacity="0.9" vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <g fill="#FCCC01">
        {c.arcs.flatMap((a, i) => a.dots.map(([x, y]) => <circle key={`${i}-${x}`} cx={x} cy={y} r="4" />))}
      </g>
      <g className="hero-glide">
        <PlaneGlyph
          x={c.plane.x}
          y={c.plane.y}
          size={c.plane.size}
          rotate={planeRotation(c.plane.from, c.plane.x, c.plane.y)}
        />
      </g>
    </svg>
  )
}

export default function HeroArtRoutes() {
  return (
    <>
      <Routes c={PHONE} />
      <Routes c={DESKTOP} />
    </>
  )
}
