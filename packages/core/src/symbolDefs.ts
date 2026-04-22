import { SchematicSymbolDef, PinType } from './schematic/types'

export type SymbolType = "resistor" | "capacitor" | "led" | "ic" | "74HC08" | "74HC32" | "switch" | "push_switch" | "battery" | "resistor_10k" | "resistor_470" | "capacitor_100n" | "led_green" | "led_yellow" | "and_gate" | "or_gate"

const resistorSymbol: SchematicSymbolDef = {
  id: 'resistor',
  pins: [
    { number: '1', name: '1', type: PinType.PASSIVE, connectionPoint: { x: 0, y: 25 }, bodyEdge: { x: 20, y: 25 }, angle: 0 },
    { number: '2', name: '2', type: PinType.PASSIVE, connectionPoint: { x: 100, y: 25 }, bodyEdge: { x: 80, y: 25 }, angle: 180 },
  ],
  geometry: {
    rectangles: [{ start: { x: 20, y: 15 }, end: { x: 80, y: 35 } }],
    polylines: [
      { points: [{ x: 0, y: 25 }, { x: 20, y: 25 }] },
      { points: [{ x: 80, y: 25 }, { x: 100, y: 25 }] },
    ],
    circles: [], arcs: [],
  },
  properties: { reference: 'R', value: '10k', footprint: 'R0603', datasheet: '' },
  boundingBox: { x: 0, y: 15, width: 100, height: 20 },
}

const capacitorSymbol: SchematicSymbolDef = {
  id: 'capacitor',
  pins: [
    { number: '1', name: '+', type: PinType.PASSIVE, connectionPoint: { x: 0, y: 30 }, bodyEdge: { x: 36, y: 30 }, angle: 0 },
    { number: '2', name: '-', type: PinType.PASSIVE, connectionPoint: { x: 80, y: 30 }, bodyEdge: { x: 44, y: 30 }, angle: 180 },
  ],
  geometry: {
    rectangles: [],
    polylines: [
      { points: [{ x: 0, y: 30 }, { x: 36, y: 30 }] },
      { points: [{ x: 36, y: 10 }, { x: 36, y: 50 }] },
      { points: [{ x: 44, y: 10 }, { x: 44, y: 50 }] },
      { points: [{ x: 44, y: 30 }, { x: 80, y: 30 }] },
    ],
    circles: [], arcs: [],
  },
  properties: { reference: 'C', value: '100nF', footprint: 'C0603', datasheet: '' },
  boundingBox: { x: 0, y: 10, width: 80, height: 40 },
}

const ledSymbol: SchematicSymbolDef = {
  id: 'led',
  pins: [
    { number: '1', name: 'A', type: PinType.PASSIVE, connectionPoint: { x: 0, y: 25 }, bodyEdge: { x: 25, y: 25 }, angle: 0 },
    { number: '2', name: 'K', type: PinType.PASSIVE, connectionPoint: { x: 100, y: 25 }, bodyEdge: { x: 65, y: 25 }, angle: 180 },
  ],
  geometry: {
    rectangles: [],
    polylines: [
      { points: [{ x: 0, y: 25 }, { x: 25, y: 25 }] },
      { points: [{ x: 25, y: 10 }, { x: 25, y: 40 }, { x: 55, y: 25 }, { x: 25, y: 10 }] },
      { points: [{ x: 55, y: 10 }, { x: 55, y: 40 }] },
      { points: [{ x: 55, y: 25 }, { x: 100, y: 25 }] },
    ],
    circles: [], arcs: [],
  },
  properties: { reference: 'D', value: 'RED', footprint: 'LED0603', datasheet: '' },
  boundingBox: { x: 0, y: 10, width: 100, height: 30 },
}

const icSymbol: SchematicSymbolDef = {
  id: 'ic',
  pins: [
    { number: '1', name: 'IN', type: PinType.INPUT, connectionPoint: { x: 0, y: 20 }, bodyEdge: { x: 40, y: 20 }, angle: 0 },
    { number: '2', name: 'GND', type: PinType.POWER_IN, connectionPoint: { x: 0, y: 60 }, bodyEdge: { x: 40, y: 60 }, angle: 0 },
    { number: '3', name: 'OUT', type: PinType.OUTPUT, connectionPoint: { x: 160, y: 20 }, bodyEdge: { x: 120, y: 20 }, angle: 180 },
    { number: '4', name: 'VCC', type: PinType.POWER_IN, connectionPoint: { x: 160, y: 60 }, bodyEdge: { x: 120, y: 60 }, angle: 180 },
  ],
  geometry: {
    rectangles: [{ start: { x: 40, y: 0 }, end: { x: 120, y: 80 } }],
    polylines: [
      { points: [{ x: 0, y: 20 }, { x: 40, y: 20 }] },
      { points: [{ x: 0, y: 60 }, { x: 40, y: 60 }] },
      { points: [{ x: 120, y: 20 }, { x: 160, y: 20 }] },
      { points: [{ x: 120, y: 60 }, { x: 160, y: 60 }] },
    ],
    circles: [], arcs: [],
  },
  properties: { reference: 'U', value: 'IC', footprint: 'DIP8', datasheet: '' },
  boundingBox: { x: 0, y: 0, width: 160, height: 80 },
}

const andGateSymbol: SchematicSymbolDef = {
  id: 'and_gate',
  pins: [
    { number: '1', name: 'A', type: PinType.INPUT, connectionPoint: { x: 0, y: 35 }, bodyEdge: { x: 40, y: 35 }, angle: 0 },
    { number: '2', name: 'B', type: PinType.INPUT, connectionPoint: { x: 0, y: 65 }, bodyEdge: { x: 40, y: 65 }, angle: 0 },
    { number: '3', name: 'GND', type: PinType.POWER_IN, connectionPoint: { x: 70, y: 120 }, bodyEdge: { x: 70, y: 80 }, angle: 90 },
    { number: '4', name: 'Y', type: PinType.OUTPUT, connectionPoint: { x: 140, y: 50 }, bodyEdge: { x: 100, y: 50 }, angle: 180 },
    { number: '5', name: 'VCC', type: PinType.POWER_IN, connectionPoint: { x: 70, y: -20 }, bodyEdge: { x: 70, y: 20 }, angle: 270 },
  ],
  geometry: {
    rectangles: [],
    polylines: [
      { points: [{ x: 40, y: 20 }, { x: 40, y: 80 }] }, // Back
      { points: [{ x: 40, y: 20 }, { x: 70, y: 20 }] }, // Top-back
      { points: [{ x: 40, y: 80 }, { x: 70, y: 80 }] }, // Bottom-back
      { points: [{ x: 0, y: 35 }, { x: 40, y: 35 }] },  // Pin 1 wire extension
      { points: [{ x: 0, y: 65 }, { x: 40, y: 65 }] },  // Pin 2 wire extension
      { points: [{ x: 100, y: 50 }, { x: 140, y: 50 }] }, // Pin 4 wire extension
      { points: [{ x: 70, y: -20 }, { x: 70, y: 20 }] }, // Pin 5 wire extension
      { points: [{ x: 70, y: 100 }, { x: 70, y: 120 }] }, // Pin 3 wire extension
    ],
    circles: [],
    arcs: [
      { start: { x: 70, y: 20 }, mid: { x: 100, y: 50 }, end: { x: 70, y: 80 } }, // Front curve
    ],
  },
  properties: { reference: 'U', value: '74AHC1G08', footprint: 'SOT-23-5', datasheet: '' },
  boundingBox: { x: 0, y: -20, width: 140, height: 140 },
}

const orGateSymbol: SchematicSymbolDef = {
  id: 'or_gate',
  pins: [
    { number: '1', name: 'A', type: PinType.INPUT, connectionPoint: { x: 0, y: 35 }, bodyEdge: { x: 40, y: 35 }, angle: 0 },
    { number: '2', name: 'B', type: PinType.INPUT, connectionPoint: { x: 0, y: 65 }, bodyEdge: { x: 40, y: 65 }, angle: 0 },
    { number: '3', name: 'GND', type: PinType.POWER_IN, connectionPoint: { x: 70, y: 120 }, bodyEdge: { x: 70, y: 84 }, angle: 90 },
    { number: '4', name: 'Y', type: PinType.OUTPUT, connectionPoint: { x: 140, y: 50 }, bodyEdge: { x: 110, y: 50 }, angle: 180 },
    { number: '5', name: 'VCC', type: PinType.POWER_IN, connectionPoint: { x: 70, y: -20 }, bodyEdge: { x: 70, y: 16 }, angle: 270 },
  ],
  geometry: {
    rectangles: [],
    polylines: [
      { points: [{ x: 0, y: 35 }, { x: 42, y: 35 }] },
      { points: [{ x: 0, y: 65 }, { x: 42, y: 65 }] },
      { points: [{ x: 110, y: 50 }, { x: 140, y: 50 }] },
      { points: [{ x: 70, y: -20 }, { x: 70, y: 16 }] },
      { points: [{ x: 70, y: 100 }, { x: 70, y: 120 }] },
    ],
    circles: [],
    arcs: [
      { start: { x: 40, y: 10 }, mid: { x: 50, y: 50 }, end: { x: 40, y: 90 } },     // Back curve
      { start: { x: 40, y: 10 }, mid: { x: 75, y: 15 }, end: { x: 110, y: 50 } },  // Top curve
      { start: { x: 40, y: 90 }, mid: { x: 75, y: 85 }, end: { x: 110, y: 50 } },  // Bottom curve
    ],
  },
  properties: { reference: 'U', value: '74AHC1G32', footprint: 'SOT-23-5', datasheet: '' },
  boundingBox: { x: 0, y: -20, width: 140, height: 140 },
}

export const SYMBOL_DEFS: Record<SymbolType, SchematicSymbolDef> = {
  resistor: resistorSymbol,
  capacitor: capacitorSymbol,
  led: ledSymbol,
  ic: icSymbol,
  and_gate: andGateSymbol,
  or_gate: orGateSymbol,
  "74HC08": {
    id: '74HC08',
    pins: [
      ...[1, 2, 3, 4, 5, 6, 7].map((n, i) => {
        let type = PinType.INPUT;
        if (n === 3 || n === 6) type = PinType.OUTPUT;
        if (n === 7) type = PinType.POWER_IN;
        return {
          number: n.toString(),
          name: n === 7 ? 'GND' : `P${n}`,
          type,
          connectionPoint: { x: 0, y: 20 + i * 30 },
          bodyEdge: { x: 40, y: 20 + i * 30 },
          angle: 0
        };
      }),
      ...[8, 9, 10, 11, 12, 13, 14].map((n, i) => {
        let type = PinType.INPUT;
        if (n === 8 || n === 11) type = PinType.OUTPUT;
        if (n === 14) type = PinType.POWER_IN;
        return {
          number: n.toString(),
          name: n === 14 ? 'VCC' : `P${n}`,
          type,
          connectionPoint: { x: 160, y: 200 - i * 30 },
          bodyEdge: { x: 120, y: 200 - i * 30 },
          angle: 180
        };
      }),
    ],
    geometry: {
      rectangles: [{ start: { x: 40, y: 0 }, end: { x: 120, y: 220 } }],
      polylines: [
        ...Array.from({ length: 7 }).map((_, i) => ({ points: [{ x: 0, y: 20 + i * 30 }, { x: 40, y: 20 + i * 30 }] })),
        ...Array.from({ length: 7 }).map((_, i) => ({ points: [{ x: 120, y: 20 + i * 30 }, { x: 160, y: 20 + i * 30 }] })),
      ],
      circles: [], arcs: [],
    },
    properties: { reference: 'U', value: '74HC08', footprint: 'DIP14', datasheet: '' },
    boundingBox: { x: 0, y: 0, width: 160, height: 220 },
  },
  "74HC32": {
    id: '74HC32',
    pins: [
      ...[1, 2, 3, 4, 5, 6, 7].map((n, i) => {
        let type = PinType.INPUT;
        if (n === 3 || n === 6) type = PinType.OUTPUT;
        if (n === 7) type = PinType.POWER_IN;
        return {
          number: n.toString(),
          name: n === 7 ? 'GND' : `P${n}`,
          type,
          connectionPoint: { x: 0, y: 20 + i * 30 },
          bodyEdge: { x: 40, y: 20 + i * 30 },
          angle: 0
        };
      }),
      ...[8, 9, 10, 11, 12, 13, 14].map((n, i) => {
        let type = PinType.INPUT;
        if (n === 8 || n === 11) type = PinType.OUTPUT;
        if (n === 14) type = PinType.POWER_IN;
        return {
          number: n.toString(),
          name: n === 14 ? 'VCC' : `P${n}`,
          type,
          connectionPoint: { x: 160, y: 200 - i * 30 },
          bodyEdge: { x: 120, y: 200 - i * 30 },
          angle: 180
        };
      }),
    ],
    geometry: {
      rectangles: [{ start: { x: 40, y: 0 }, end: { x: 120, y: 220 } }],
      polylines: [
        ...Array.from({ length: 7 }).map((_, i) => ({ points: [{ x: 0, y: 20 + i * 30 }, { x: 40, y: 20 + i * 30 }] })),
        ...Array.from({ length: 7 }).map((_, i) => ({ points: [{ x: 120, y: 20 + i * 30 }, { x: 160, y: 20 + i * 30 }] })),
      ],
      circles: [], arcs: [],
    },
    properties: { reference: 'U', value: '74HC32', footprint: 'DIP14', datasheet: '' },
    boundingBox: { x: 0, y: 0, width: 160, height: 220 },
  },
  "switch": {
    id: 'switch',
    pins: [
      { number: '1', name: 'A', type: PinType.PASSIVE, connectionPoint: { x: 0, y: 20 }, bodyEdge: { x: 20, y: 20 }, angle: 0 },
      { number: '2', name: 'B', type: PinType.PASSIVE, connectionPoint: { x: 80, y: 20 }, bodyEdge: { x: 60, y: 20 }, angle: 180 },
    ],
    geometry: {
      rectangles: [{ start: { x: 20, y: 0 }, end: { x: 60, y: 40 } }],
      polylines: [
        { points: [{ x: 0, y: 20 }, { x: 20, y: 20 }] },
        { points: [{ x: 60, y: 20 }, { x: 80, y: 20 }] },
        { points: [{ x: 30, y: 0 }, { x: 50, y: 0 }] },
      ],
      circles: [], arcs: [],
    },
    properties: { reference: 'SW', value: 'Slide', footprint: 'SW_SLIDE_SPDT', datasheet: '' },
    boundingBox: { x: 0, y: 0, width: 80, height: 40 },
  },
  "battery": {
    id: 'battery',
    pins: [
      { number: '1', name: '+', type: PinType.PASSIVE, connectionPoint: { x: 0, y: 20 }, bodyEdge: { x: 35, y: 20 }, angle: 0 },
      { number: '2', name: '-', type: PinType.PASSIVE, connectionPoint: { x: 80, y: 20 }, bodyEdge: { x: 45, y: 20 }, angle: 180 },
    ],
    geometry: {
      rectangles: [],
      polylines: [
        { points: [{ x: 0, y: 20 }, { x: 35, y: 20 }] }, // Left lead
        { points: [{ x: 80, y: 20 }, { x: 45, y: 20 }] }, // Right lead
        { points: [{ x: 35, y: 5 }, { x: 35, y: 35 }] },  // Long plate (+)
        { points: [{ x: 45, y: 12 }, { x: 45, y: 28 }] }, // Short plate (-)
      ],
      circles: [], arcs: [],
    },
    properties: { reference: 'BT', value: '3V', footprint: 'BAT_HLD_001', datasheet: '' },
    boundingBox: { x: 0, y: 5, width: 80, height: 30 },
  },
  "push_switch": {
    id: 'push_switch',
    pins: [
      { number: '1', name: '1', type: PinType.PASSIVE, connectionPoint: { x: 0, y: 30 }, bodyEdge: { x: 20, y: 30 }, angle: 0 },
      { number: '2', name: '2', type: PinType.PASSIVE, connectionPoint: { x: 80, y: 30 }, bodyEdge: { x: 60, y: 30 }, angle: 180 },
      { number: '3', name: '3', type: PinType.PASSIVE, connectionPoint: { x: 40, y: 60 }, bodyEdge: { x: 40, y: 40 }, angle: 90 },
    ],
    geometry: {
      rectangles: [],
      polylines: [
        { points: [{ x: 0, y: 30 }, { x: 20, y: 30 }] },
        { points: [{ x: 60, y: 30 }, { x: 80, y: 30 }] },
        // The "T" plunger/contact
        { points: [{ x: 20, y: 20 }, { x: 60, y: 20 }] },
        { points: [{ x: 40, y: 20 }, { x: 40, y: 5 }] },
      ],
      circles: [
        { center: { x: 20, y: 30 }, radius: 3 },
        { center: { x: 60, y: 30 }, radius: 3 },
      ], 
      arcs: [],
    },
    properties: { reference: 'SW', value: 'PUSH', footprint: 'SW_PUSH_6MM', datasheet: '' },
    boundingBox: { x: 0, y: 0, width: 80, height: 40 },
  },
  "resistor_10k": {
    ...resistorSymbol,
    id: 'resistor_10k',
    properties: { ...resistorSymbol.properties, value: '10k' },
  },
  "resistor_470": {
    ...resistorSymbol,
    id: 'resistor_470',
    properties: { ...resistorSymbol.properties, value: '470' },
  },
  "capacitor_100n": {
    ...capacitorSymbol,
    id: 'capacitor_100n',
    properties: { ...capacitorSymbol.properties, value: '100nF' },
  },
  "led_green": {
    ...ledSymbol,
    id: 'led_green',
    properties: { ...ledSymbol.properties, value: 'GREEN', footprint: 'LED_3MM' },
  },
  "led_yellow": {
    ...ledSymbol,
    id: 'led_yellow',
    properties: { ...ledSymbol.properties, value: 'YELLOW', footprint: 'LED_3MM' },
  },
}
