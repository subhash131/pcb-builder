import { Netlist, FOOTPRINT_DEFS, computeRatsnestMST, RatsnestLine, PCB_FOOTPRINT_SCALE } from '@workspace/core';

export type { RatsnestLine };

export interface FootprintDB {
  _id: string;
  componentRef: string;
  footprintId: string;
  x: number;
  y: number;
  rotation: number;
  layer: 'F.Cu' | 'B.Cu';
}

/**
 * Derives the ratsnest from a schematic netlist and current footprint placements.
 *
 * Pad positions are keyed by "componentRef.pinNumber" (e.g. "R1.1"), which are
 * sourced from the footprint placements and their geometric definitions.
 */
export function computeRatsnest(
  netlist: Netlist,
  footprints: FootprintDB[] // pcb_footprints from Convex
): RatsnestLine[] {
  if (!netlist || !footprints?.length) return [];

  // Build pad position map: "R1.1" → { x, y, padRef }
  const padPositions = new Map<string, { x: number; y: number; padRef: string }>();
  
  for (const fp of footprints) {
    // 1. Resolve geometry for this footprint
    // In Convex, footprintId might be "Resistor_SMD:R_0805_2012Metric"
    // We need to map it to our internal registry keys (R0603, R0805, etc.)
    let defKey = fp.footprintId;
    if (defKey.includes('0603')) defKey = 'R0603';
    else if (defKey.includes('0805')) defKey = 'R0805';
    else if (defKey.includes('DIP')) defKey = 'DIP8';
    
    const def = FOOTPRINT_DEFS[defKey] || FOOTPRINT_DEFS['R0603'];
    
    // Resolve all pins for this component from the netlist
    const pins = netlist.getComponentPins(fp.componentRef);
    
    for (const pin of pins) {
      // Find the pad definition for this pin number
      const padDef = def?.pads.find(p => p.number === pin.pinNumber);
      if (!padDef) continue;

      // Key: "componentRef.pinNumber" — matches PinNode.ref after normalization
      const key = `${fp.componentRef}.${pin.pinNumber}`;
      
      // Calculate absolute position: fp center + pad offset (scaled visually)
      // Note: rotation needs to be accounted for if it's non-zero
      const rad = (fp.rotation * Math.PI) / 180;
      
      const scale = PCB_FOOTPRINT_SCALE;
      const scaledRelativeX = padDef.x * scale;
      const scaledRelativeY = padDef.y * scale;

      const rotatedX = scaledRelativeX * Math.cos(rad) - scaledRelativeY * Math.sin(rad);
      const rotatedY = scaledRelativeX * Math.sin(rad) + scaledRelativeY * Math.cos(rad);

      padPositions.set(key, { 
        x: fp.x + rotatedX, 
        y: fp.y + rotatedY, 
        padRef: key 
      });
    }
  }

  const nets = netlist.getNets();
  return computeRatsnestMST(nets, padPositions);
}
