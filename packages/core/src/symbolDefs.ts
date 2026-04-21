/**
 * Canonical symbol definitions — single source of truth used by both the
 * manual library sidebar AND the AI agent prompt to ensure consistent sizing.
 */
export type SymbolType = 'resistor' | 'capacitor' | 'led' | 'ic'

export interface PinDef {
  id: string
  x: number   // fractional 0-1, where 0=left edge, 1=right edge
  y: number   // fractional 0-1, where 0=top edge, 1=bottom edge
  label: string
}

export interface SymbolDef {
  w: number
  h: number
  defaultLabel: string
  defaultDesignatorPrefix: string
  defaultFootprint: string
  pins: PinDef[]
}

export const SYMBOL_DEFS: Record<SymbolType, SymbolDef> = {
  resistor: {
    w: 100,
    h: 50,
    defaultLabel: '10k',
    defaultDesignatorPrefix: 'R',
    defaultFootprint: 'R0603',
    pins: [
      { id: '1', x: 0, y: 0.5, label: '1' },
      { id: '2', x: 1, y: 0.5, label: '2' },
    ],
  },
  capacitor: {
    w: 80,
    h: 60,
    defaultLabel: '100nF',
    defaultDesignatorPrefix: 'C',
    defaultFootprint: 'C0603',
    pins: [
      { id: '1', x: 0, y: 0.5, label: '+' },
      { id: '2', x: 1, y: 0.5, label: '-' },
    ],
  },
  led: {
    w: 100,
    h: 50,
    defaultLabel: 'RED',
    defaultDesignatorPrefix: 'D',
    defaultFootprint: 'LED0603',
    pins: [
      { id: '1', x: 0, y: 0.5, label: 'A' },
      { id: '2', x: 1, y: 0.5, label: 'K' },
    ],
  },
  ic: {
    w: 160,
    h: 80,
    defaultLabel: 'IC',
    defaultDesignatorPrefix: 'U',
    defaultFootprint: 'DIP8',
    pins: [
      { id: '1', x: 0, y: 0.25, label: 'IN' },
      { id: '2', x: 0, y: 0.75, label: 'GND' },
      { id: '3', x: 1, y: 0.25, label: 'OUT' },
      { id: '4', x: 1, y: 0.75, label: 'VCC' },
    ],
  },
}
