export enum GridUnit {
  MM = 'mm',
  MIL = 'mil'
}

export const MIL_TO_MM = 0.0254;
export const MM_TO_MIL = 39.3701;

// 1mm = 10 units in our coordinate system (allowing 0.1mm precision as integer)
// Or we can just use 1:1 mm if we use floats. 
// Given tldraw uses floats, let's use 1 unit = 1mm for PCB layout.
// Schematic uses a larger relative scale for better visibility (fewer px per mm makes shapes look bigger)
export const SCHEMATIC_MM_TO_PX = 6;
// PCB uses a high density scale for precision (10px per mm = 0.1mm grid)
export const PCB_MM_TO_PX = 6;
// High-visibility scaling for PCB footprints (multiplied after mmToPx)
export const PCB_FOOTPRINT_SCALE = 4;

export interface GridConfig {
  unit: GridUnit;
  size: number;        // e.g., 0.1 in mm, or 5 in mil
  snapEnabled: boolean;
}

export const DEFAULT_GRID: GridConfig = {
  unit: GridUnit.MM,
  size: 0.1,
  snapEnabled: true,
};

export function mmToPx(mm: number, mode: 'schematic' | 'pcb' = 'pcb'): number {
  const scale = mode === 'schematic' ? SCHEMATIC_MM_TO_PX : PCB_MM_TO_PX;
  return mm * scale;
}

export function pxToMm(px: number, mode: 'schematic' | 'pcb' = 'pcb'): number {
  const scale = mode === 'schematic' ? SCHEMATIC_MM_TO_PX : PCB_MM_TO_PX;
  return px / scale;
}

export function milToMm(mil: number): number {
  return mil * MIL_TO_MM;
}

export function mmToMil(mm: number): number {
  return mm * MM_TO_MIL;
}
