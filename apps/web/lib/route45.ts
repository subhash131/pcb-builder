export interface Vec { x: number; y: number }

/**
 * Generates a 45°-elbow PCB routing path between two points.
 *
 * Strategy:
 *   - Computes the shorter diagonal leg then the straight leg
 *   - Returns [start, ...intermediatePoints, end] — 2 or 3 points
 *
 * Corner radius is applied as a hint in the SVG builder (not here).
 */
export function route45(from: Vec, to: Vec): Vec[] {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)

  const EPSILON = 0.5

  // Already aligned — straight line
  if (adx < EPSILON && ady < EPSILON) return [from, to]
  if (adx < EPSILON) return [from, to]  // perfectly vertical
  if (ady < EPSILON) return [from, to]  // perfectly horizontal

  // The diagonal part covers min(|dx|, |dy|) in both axes
  const diag = Math.min(adx, ady)
  const signX = dx > 0 ? 1 : -1
  const signY = dy > 0 ? 1 : -1

  if (adx >= ady) {
    // More horizontal: diagonal first, then horizontal
    const elbow: Vec = { x: from.x + signX * diag, y: from.y + signY * diag }
    return [from, elbow, to]
  } else {
    // More vertical: diagonal first, then vertical
    const elbow: Vec = { x: from.x + signX * diag, y: from.y + signY * diag }
    return [from, elbow, to]
  }
}

/**
 * Converts an array of waypoints to an SVG path string with rounded corners.
 *
 * @param points  - absolute pixel coordinates
 * @param radius  - corner radius in pixels (for bezier curve at elbows)
 */
export function pointsToSVGPath(points: Vec[], radius = 6): string {
  if (points.length < 2) return ''
  if (points.length === 2) {
    return `M ${points[0]!.x} ${points[0]!.y} L ${points[1]!.x} ${points[1]!.y}`
  }

  let d = `M ${points[0]!.x} ${points[0]!.y}`

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const next = points[i + 1]!

    // Vector from prev→curr and curr→next
    const d1x = curr.x - prev.x
    const d1y = curr.y - prev.y
    const d2x = next.x - curr.x
    const d2y = next.y - curr.y

    const len1 = Math.sqrt(d1x * d1x + d1y * d1y)
    const len2 = Math.sqrt(d2x * d2x + d2y * d2y)

    // Limit radius to half the shorter segment
    const r = Math.min(radius, len1 / 2, len2 / 2)

    if (r < 0.5) {
      // Segments too short to round — just line to curr
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    // Point just before the corner
    const t1x = curr.x - (d1x / len1) * r
    const t1y = curr.y - (d1y / len1) * r

    // Point just after the corner
    const t2x = curr.x + (d2x / len2) * r
    const t2y = curr.y + (d2y / len2) * r

    // Line to pre-corner, then quadratic bezier through corner
    d += ` L ${t1x} ${t1y} Q ${curr.x} ${curr.y} ${t2x} ${t2y}`
  }

  // Final segment
  const last = points[points.length - 1]!
  d += ` L ${last.x} ${last.y}`

  return d
}
