import { ComponentNode, PinNode } from '../types/net';

export interface RatsnestLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  netId: string;
}

interface Point {
  x: number;
  y: number;
  padRef: string; // "R1.1"
}

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Prim's MST — O(n²), fine for n < 100. No PCB net has 100 pins.
 * Connects only real pads, guiding the user to actual routing decisions.
 */
function computeMST(points: Point[]): Array<[Point, Point]> {
  if (points.length < 2) return [];

  const inTree = new Set<number>([0]);
  const edges: Array<[Point, Point]> = [];

  while (inTree.size < points.length) {
    let bestDist = Infinity;
    let bestEdge: [Point, Point] | null = null;
    let nextNode = -1;

    for (const i of inTree) {
      for (let j = 0; j < points.length; j++) {
        if (inTree.has(j)) continue;
        const pi = points[i]!;
        const pj = points[j]!;
        const d = dist(pi, pj);
        if (d < bestDist) {
          bestDist = d;
          bestEdge = [pi, pj];
          nextNode = j;
        }
      }
    }

    if (!bestEdge || nextNode === -1) break;
    edges.push(bestEdge);
    inTree.add(nextNode);
  }

  return edges;
}

/**
 * Computes the ratsnest for a set of nets given a map of pad positions.
 * Each net is computed as an MST between real pad positions.
 *
 * @param nets - Array of nets from netlist.getNets()
 * @param padPositions - Map from padRef "R1.1" → { x, y } in mm
 */
export function computeRatsnestMST(
  nets: Array<{ netId: string; pins: PinNode[] }>,
  padPositions: Map<string, Point>
): RatsnestLine[] {
  return nets.flatMap(({ netId, pins }) => {
    const points: Point[] = pins
      .map(pin => padPositions.get(pin.ref))
      .filter((p): p is Point => p !== undefined);

    return computeMST(points).map(([a, b]) => ({
      x1: a.x, y1: a.y,
      x2: b.x, y2: b.y,
      netId,
    }));
  });
}
