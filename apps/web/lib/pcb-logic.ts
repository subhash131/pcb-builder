import { Netlist } from '@workspace/core';
import { computeRatsnestMST, RatsnestLine } from '@workspace/core';

export type { RatsnestLine };

/**
 * Derives the ratsnest from a schematic netlist and current footprint placements.
 *
 * Pad positions are keyed by "componentRef.pinNumber" (e.g. "R1.1"), which are
 * sourced directly from the footprint placements stored in the DB.
 * For this iteration, each pad is centered at the footprint origin.
 * When a library is added in Phase 3, this will look up the pad offset from the footprint def.
 */
export function computeRatsnest(
  netlist: Netlist,
  footprints: any[] // pcb_footprints from Convex
): RatsnestLine[] {
  if (!netlist || !footprints?.length) return [];

  // Build pad position map: "R1.1" → { x, y, padRef }
  const padPositions = new Map<string, { x: number; y: number; padRef: string }>();
  for (const fp of footprints) {
    // Resolve all pins for this component from the netlist
    const pins = netlist.getComponentPins(fp.componentRef);
    for (const pin of pins) {
      // Key: "componentRef.pinNumber" — matches PinNode.ref after normalization
      const key = `${fp.componentRef}.${pin.pinNumber}`;
      padPositions.set(key, { x: fp.x, y: fp.y, padRef: key });
    }
  }

  const nets = netlist.getNets();
  return computeRatsnestMST(nets, padPositions);
}

