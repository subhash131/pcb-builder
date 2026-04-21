// IPC-7351 standard footprint definitions

export interface PadDef {
  number: string
  x: number         // mm from footprint center
  y: number         // mm from footprint center
  width: number     // mm
  height: number    // mm
  shape: 'rect' | 'circle'
}

export interface FootprintDef {
  id: string
  w: number         // bounding box width (mm)
  h: number         // bounding box height (mm)
  pads: PadDef[]
  silkscreen: Array<{ x1: number, y1: number, x2: number, y2: number }>
  courtyard: { x: number, y: number, w: number, h: number }
}

export const FOOTPRINT_DEFS: Record<string, FootprintDef> = {
  R0603: {
    id: 'R0603',
    w: 3.0,
    h: 2.0,
    pads: [
      { number: '1', x: -0.9, y: 0, width: 1.0, height: 1.4, shape: 'rect' },
      { number: '2', x: 0.9, y: 0, width: 1.0, height: 1.4, shape: 'rect' },
    ],
    silkscreen: [
      { x1: -0.3, y1: -0.6, x2: 0.3, y2: -0.6 },
      { x1: -0.3, y1: 0.6, x2: 0.3, y2: 0.6 },
    ],
    courtyard: { x: -1.6, y: -1.0, w: 3.2, h: 2.0 },
  },
  C0603: {
    id: 'C0603',
    w: 3.0,
    h: 2.0,
    pads: [
      { number: '1', x: -0.9, y: 0, width: 1.0, height: 1.4, shape: 'rect' },
      { number: '2', x: 0.9, y: 0, width: 1.0, height: 1.4, shape: 'rect' },
    ],
    silkscreen: [
      { x1: -0.3, y1: -0.7, x2: -0.3, y2: 0.7 }, // Side bars for capacitor visual
      { x1: 0.3, y1: -0.7, x2: 0.3, y2: 0.7 },
    ],
    courtyard: { x: -1.6, y: -1.0, w: 3.2, h: 2.0 },
  },
  R0805: {
    id: 'R0805',
    w: 4.0,
    h: 2.5,
    pads: [
      { number: '1', x: -1.1, y: 0, width: 1.2, height: 1.5, shape: 'rect' },
      { number: '2', x: 1.1, y: 0, width: 1.2, height: 1.5, shape: 'rect' },
    ],
    silkscreen: [
      { x1: -0.4, y1: -0.8, x2: 0.4, y2: -0.8 },
      { x1: -0.4, y1: 0.8, x2: 0.4, y2: 0.8 },
    ],
    courtyard: { x: -2.0, y: -1.25, w: 4.0, h: 2.5 },
  },
  C0805: {
    id: 'C0805',
    w: 4.0,
    h: 2.5,
    pads: [
      { number: '1', x: -1.1, y: 0, width: 1.2, height: 1.5, shape: 'rect' },
      { number: '2', x: 1.1, y: 0, width: 1.2, height: 1.5, shape: 'rect' },
    ],
    silkscreen: [
      { x1: -0.4, y1: -0.8, x2: 0.4, y2: -0.8 },
      { x1: -0.4, y1: 0.8, x2: 0.4, y2: 0.8 },
    ],
    courtyard: { x: -2.0, y: -1.25, w: 4.0, h: 2.5 },
  },
  DIP8: {
    id: 'DIP8',
    w: 12.0,
    h: 10.0,
    pads: [
      // Left side
      { number: '1', x: -3.81, y: -3.81, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '2', x: -3.81, y: -1.27, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '3', x: -3.81, y: 1.27, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '4', x: -3.81, y: 3.81, width: 1.6, height: 1.6, shape: 'circle' },
      // Right side
      { number: '5', x: 3.81, y: 3.81, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '6', x: 3.81, y: 1.27, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '7', x: 3.81, y: -1.27, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '8', x: 3.81, y: -3.81, width: 1.6, height: 1.6, shape: 'circle' },
    ],
    silkscreen: [
      { x1: -3.0, y1: -4.8, x2: 3.0, y2: -4.8 }, // Top
      { x1: -3.0, y1: 4.8, x2: 3.0, y2: 4.8 },   // Bottom
      { x1: -3.0, y1: -4.8, x2: -3.0, y2: -4.0 }, // Notch start
      { x1: -3.0, y1: -3.0, x2: -3.0, y2: 4.8 },  
      { x1: 3.0, y1: -4.8, x2: 3.0, y2: 4.8 },
    ],
    courtyard: { x: -5.0, y: -5.0, w: 10.0, h: 10.0 },
  },
  LED0603: {
    id: 'LED0603',
    w: 3.2,
    h: 2.0,
    pads: [
      { number: '1', x: -0.9, y: 0, width: 1.0, height: 1.4, shape: 'rect' }, // Anode
      { number: '2', x: 0.9, y: 0, width: 1.0, height: 1.4, shape: 'rect' }, // Cathode
    ],
    silkscreen: [
      { x1: -0.4, y1: -0.8, x2: 0.4, y2: 0 },    // Triangle top
      { x1: 0.4, y1: 0, x2: -0.4, y2: 0.8 },    // Triangle bottom
      { x1: -0.4, y1: 0.8, x2: -0.4, y2: -0.8 }, // Triangle back
      { x1: 0.5, y1: -0.8, x2: 0.5, y2: 0.8 },   // Cathode bar
    ],
    courtyard: { x: -1.8, y: -1.2, w: 3.6, h: 2.4 },
  },
  LED0805: {
    id: 'LED0805',
    w: 4.0,
    h: 2.5,
    pads: [
      { number: '1', x: -1.1, y: 0, width: 1.2, height: 1.5, shape: 'rect' },
      { number: '2', x: 1.1, y: 0, width: 1.2, height: 1.5, shape: 'rect' },
    ],
    silkscreen: [
      { x1: -0.5, y1: -1.0, x2: 0.5, y2: 0 },
      { x1: 0.5, y1: 0, x2: -0.5, y2: 1.0 },
      { x1: -0.5, y1: 1.0, x2: -0.5, y2: -1.0 },
      { x1: 0.7, y1: -1.0, x2: 0.7, y2: 1.0 },
    ],
    courtyard: { x: -2.2, y: -1.5, w: 4.4, h: 3.0 },
  },
}
