import { PLANE_BOX, PLANE_PATHS } from '@/components/brand/PlaneMark'

// WHY-79, direction C: scale. The mark itself as the composition: one plane
// far larger than the hero, cropped by its right edge, in yellow at 7% over
// Ink (renders ≈ #2A2814), so white type keeps ~14:1 on top of it. At this
// size the gaps between the faces read as the creases of the folded sheet.
export default function HeroArtScale() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="hero-drift absolute pointer-events-none w-[150%] right-[-38%] top-[20%] md:w-auto md:h-[118%] md:right-[-14%] md:top-[-6%]"
      viewBox={`${PLANE_BOX.minX} ${PLANE_BOX.minY} ${PLANE_BOX.width} ${PLANE_BOX.height}`}
      preserveAspectRatio="xMaxYMin meet"
      style={{ aspectRatio: `${PLANE_BOX.width} / ${PLANE_BOX.height}` }}
    >
      <g fill="#FCCC01" fillOpacity="0.07">
        {PLANE_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  )
}
