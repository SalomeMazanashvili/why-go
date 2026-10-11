// The WHYGO plane, exactly as drawn in the logo assets (whygo-logo-assets,
// extracted from WhyGo-logo-rules v3): not redrawn. Unit coordinates with
// the nose at the origin; the body extends left and down.
//
// Construction rule: every edge is a ray from the nose. The faces' edges
// leave it at 15.47°, 23.73°, 26.13°, 30.60°, 33.00° and 61.63° below the
// horizontal, and the creases step by 2.4° (23.73→26.13, 30.60→33.00).
export const PLANE_PATHS = [
  'M 0.00000 0.00000 L -0.73694 0.32395 L -0.96377 0.26673 Z',
  'M 0.00000 0.00000 L -0.61113 0.36142 L -0.64683 0.55147 L -0.71734 0.35189 Z',
  'M 0.00000 0.00000 L -0.30030 0.55610 L -0.57533 0.37362 Z',
  'M -0.62183 0.56325 L -0.49896 0.44864 L -0.57950 0.39088 Z',
] as const

// Bounding box in unit coordinates.
export const PLANE_BOX = { minX: -0.96377, minY: 0, width: 0.96377, height: 0.56325 } as const
