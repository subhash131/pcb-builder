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
  silkscreenCircles?: Array<{ cx: number, cy: number, r: number }>
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
  SW_PUSH_6MM: {
    id: 'SW_PUSH_6MM',
    w: 6.0,
    h: 6.0,
    pads: [
      { number: '1', x: -1.75, y: -1.75, width: 1.5, height: 1.5, shape: 'circle' },
      { number: '2', x: 1.75, y: -1.75, width: 1.5, height: 1.5, shape: 'circle' },
      { number: '3', x: 0, y: 1.75, width: 1.5, height: 1.5, shape: 'circle' },
    ],
    silkscreen: [
      // Main body outline (4.5x4.5mm)
      { x1: -2.25, y1: -2.25, x2: 2.25, y2: -2.25 },
      { x1: -2.25, y1: 2.25, x2: 2.25, y2: 2.25 },
      { x1: -2.25, y1: -2.25, x2: -2.25, y2: 2.25 },
      { x1: 2.25, y1: -2.25, x2: 2.25, y2: 2.25 },
      // Corner markers
      { x1: -2.25, y1: -1.5, x2: -1.8, y2: -1.5 },
      { x1: -2.25, y1: 1.5, x2: -1.8, y2: 1.5 },
      { x1: 2.25, y1: -1.5, x2: 1.8, y2: -1.5 },
      { x1: 2.25, y1: 1.5, x2: 1.8, y2: 1.5 },
      // Plunger/Slider detail
      { x1: -0.6, y1: -1.6, x2: 0.6, y2: -1.6 },
      { x1: -0.6, y1: 1.6, x2: 0.6, y2: 1.6 },
      { x1: -0.6, y1: -1.6, x2: -0.6, y2: 1.6 },
      { x1: 0.6, y1: -1.6, x2: 0.6, y2: 1.6 },
      // Internal plunger detail
      { x1: -0.3, y1: 0.5, x2: 0.3, y2: 0.5 },
      { x1: -0.3, y1: 1.2, x2: 0.3, y2: 1.2 },
      { x1: -0.3, y1: 0.5, x2: -0.3, y2: 1.2 },
      { x1: 0.3, y1: 0.5, x2: 0.3, y2: 1.2 },
    ],
    courtyard: { x: -3.0, y: -3.0, w: 6.0, h: 6.0 },
  },
  'SOT-23-5': {
    id: 'SOT-23-5',
    w: 3.0,
    h: 3.0,
    pads: [
      { number: '1', x: -0.95, y: 1.3, width: 0.6, height: 1.2, shape: 'rect' },
      { number: '2', x: 0, y: 1.3, width: 0.6, height: 1.2, shape: 'rect' },
      { number: '3', x: 0.95, y: 1.3, width: 0.6, height: 1.2, shape: 'rect' },
      { number: '4', x: 0.95, y: -1.3, width: 0.6, height: 1.2, shape: 'rect' },
      { number: '5', x: -0.95, y: -1.3, width: 0.6, height: 1.2, shape: 'rect' },
    ],
    silkscreen: [
      { x1: -1.5, y1: -0.8, x2: 1.5, y2: -0.8 },
      { x1: -1.5, y1: 0.8, x2: 1.5, y2: 0.8 },
      { x1: -1.5, y1: -0.8, x2: -1.5, y2: 0.8 },
      { x1: 1.5, y1: -0.8, x2: 1.5, y2: 0.8 },
    ],
    courtyard: { x: -2.0, y: -2.2, w: 4.0, h: 4.4 },
  },
  LED0603: {
    id: 'LED0603',
    w: 3.0,
    h: 2.0,
    pads: [
      { number: '1', x: -0.9, y: 0, width: 1.0, height: 1.4, shape: 'rect' }, // Anode
      { number: '2', x: 0.9, y: 0, width: 1.0, height: 1.4, shape: 'rect' },  // Cathode
    ],
    silkscreen: [
      { x1: -0.3, y1: -0.6, x2: -0.3, y2: 0.6 },
      { x1: -0.3, y1: 0.6, x2: 0.3, y2: 0 },
      { x1: 0.3, y1: 0, x2: -0.3, y2: -0.6 },
      { x1: 0.3, y1: -0.6, x2: 0.3, y2: 0.6 }, // Vertical bar for cathode
    ],
    courtyard: { x: -1.6, y: -1.0, w: 3.2, h: 2.0 },
  },
  LED_3MM: {
    id: 'LED_3MM',
    w: 5.0,
    h: 5.0,
    pads: [
      { number: '1', x: -1.27, y: 0, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '2', x: 1.27, y: 0, width: 1.6, height: 1.6, shape: 'circle' },
    ],
    silkscreen: [
      { x1: 1.5, y1: -1.3, x2: 1.5, y2: 1.3 }, // Flat side for cathode
    ],
    silkscreenCircles: [
      { cx: 0, cy: 0, r: 2.0 },
    ],
    courtyard: { x: -2.5, y: -2.5, w: 5.0, h: 5.0 },
  },
  BAT_HLD_001: {
    id: 'BAT_HLD_001',
    w: 22.0,
    h: 12.0,
    pads: [
      { number: '1', x: -6.35, y: 0, width: 2.0, height: 2.0, shape: 'circle' }, // Female snap (- usually)
      { number: '2', x: 6.35, y: 0, width: 3.0, height: 3.0, shape: 'circle' },  // Male snap (+ usually)
    ],
    silkscreen: [
      // Boundary — centered around y=0
      { x1: -10, y1: -5.0, x2: 10, y2: -5.0 },
      { x1: 10, y1: -5.0, x2: 10, y2: 5.0 },
      { x1: 10, y1: 5.0, x2: -10, y2: 5.0 },
      { x1: -10, y1: 5.0, x2: -10, y2: -5.0 },
      // Hexagonal snap outline for Pin 1 (Female) — Shrinked further to ~4.0mm across points as requested
      { x1: -8.35, y1: 0, x2: -7.35, y2: -1.73 },
      { x1: -7.35, y1: -1.73, x2: -5.35, y2: -1.73 },
      { x1: -5.35, y1: -1.73, x2: -4.35, y2: 0 },
      { x1: -4.35, y1: 0, x2: -5.35, y2: 1.73 },
      { x1: -5.35, y1: 1.73, x2: -7.35, y2: 1.73 },
      { x1: -7.35, y1: 1.73, x2: -8.35, y2: 0 },
      // + marker for Pin 2
      { x1: 6.35, y1: -2, x2: 6.35, y2: -4 },
      { x1: 5.35, y1: -3, x2: 7.35, y2: -3 },
    ],
    silkscreenCircles: [
      { cx: 6.35, cy: 0, r: 2.75 }, // 5.5mm diameter male snap outline
    ],
    courtyard: { x: -11.0, y: -6.0, w: 22.0, h: 12.0 },
  },
/*   SW_SLIDE_SPDT: {
    id: 'SW_SLIDE_SPDT',
    w: 12.0,
    h: 6.0,
    pads: [
      { number: '1', x: -2.54, y: 0, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '2', x: 0, y: 0, width: 1.6, height: 1.6, shape: 'circle' },
      { number: '3', x: 2.54, y: 0, width: 1.6, height: 1.6, shape: 'circle' },
    ],
    silkscreen: [
      // Main Body
      { x1: -4.5, y1: -2, x2: 4.5, y2: -2 },
      { x1: 4.5, y1: -2, x2: 4.5, y2: 2 },
      { x1: 4.5, y1: 2, x2: -4.5, y2: 2 },
      { x1: -4.5, y1: 2, x2: -4.5, y2: -2 },
      // Slider Handle
      { x1: -1.5, y1: -1, x2: 1.5, y2: -1 },
      { x1: 1.5, y1: -1, x2: 1.5, y2: 1 },
      { x1: 1.5, y1: 1, x2: -1.5, y2: 1 },
      { x1: -1.5, y1: 1, x2: -1.5, y2: -1 },
      { x1: -1, y1: 0, x2: 1, y2: 0 }, // Tick mark on slider
    ],
    courtyard: { x: -5.0, y: -2.5, w: 10.0, h: 5.0 },
  }, */
}
