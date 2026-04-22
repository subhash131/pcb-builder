export interface Vec { x: number; y: number }

/**
 * Finds an orthogonal path between two points.
 * For now, implements a simple 2-segment (L-shaped) or 3-segment (Z-shaped) routing.
 */
export function findOrthogonalPath(start: Vec, end: Vec): Vec[] {
  const dx = Math.abs(start.x - end.x)
  const dy = Math.abs(start.y - end.y)

  // Use a small epsilon to avoid unnecessary segments for aligned points
  const EPSILON = 1
  if (dx < EPSILON && dy < EPSILON) return [start, end]
  if (dx < EPSILON) return [start, { x: start.x, y: end.y }]
  if (dy < EPSILON) return [start, { x: end.x, y: start.y }]

  // Simple L-shape (x then y or y then x)
  // We can decide based on some heuristic or just pick one.
  // In schematics, horizontal segments are often preferred for longer runs.
  const elbow = { x: end.x, y: start.y }
  return [start, elbow, end]
}

/**
 * Robust version that can handle specific exit directions if needed in the future.
 */
export function routeWire(start: Vec, end: Vec): Vec[] {
  const points = findOrthogonalPath(start, end)
  return points
}
