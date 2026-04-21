import { SchematicSymbolDef, PinType } from './schematic/types'

export type SymbolType = string

export const SYMBOL_DEFS: Record<string, SchematicSymbolDef> = {
  resistor: {
    id: 'resistor',
    pins: [
      { 
        number: '1', 
        name: '1', 
        type: PinType.PASSIVE, 
        connectionPoint: { x: 0, y: 25 }, 
        bodyEdge: { x: 20, y: 25 },
        angle: 0
      },
      { 
        number: '2', 
        name: '2', 
        type: PinType.PASSIVE, 
        connectionPoint: { x: 100, y: 25 }, 
        bodyEdge: { x: 80, y: 25 },
        angle: 180
      },
    ],
    geometry: {
      rectangles: [{ start: { x: 20, y: 15 }, end: { x: 80, y: 35 } }],
      polylines: [
        { points: [{ x: 0, y: 25 }, { x: 20, y: 25 }] },
        { points: [{ x: 80, y: 25 }, { x: 100, y: 25 }] },
      ],
      circles: [],
      arcs: [],
    },
    properties: {
      reference: 'R',
      value: '10k',
      footprint: 'R0603',
      datasheet: '',
    },
    boundingBox: { x: 0, y: 15, width: 100, height: 20 },
  },
  capacitor: {
    id: 'capacitor',
    pins: [
      { 
        number: '1', 
        name: '+', 
        type: PinType.PASSIVE, 
        connectionPoint: { x: 0, y: 30 }, 
        bodyEdge: { x: 36, y: 30 },
        angle: 0
      },
      { 
        number: '2', 
        name: '-', 
        type: PinType.PASSIVE, 
        connectionPoint: { x: 80, y: 30 }, 
        bodyEdge: { x: 44, y: 30 },
        angle: 180
      },
    ],
    geometry: {
      rectangles: [],
      polylines: [
        { points: [{ x: 0, y: 30 }, { x: 36, y: 30 }] }, // Pin 1
        { points: [{ x: 36, y: 10 }, { x: 36, y: 50 }] }, // Plate 1
        { points: [{ x: 44, y: 10 }, { x: 44, y: 50 }] }, // Plate 2
        { points: [{ x: 44, y: 30 }, { x: 80, y: 30 }] }, // Pin 2
      ],
      circles: [],
      arcs: [],
    },
    properties: {
      reference: 'C',
      value: '100nF',
      footprint: 'C0603',
      datasheet: '',
    },
    boundingBox: { x: 0, y: 10, width: 80, height: 40 },
  },
  led: {
    id: 'led',
    pins: [
      { 
        number: '1', 
        name: 'A', 
        type: PinType.PASSIVE, 
        connectionPoint: { x: 0, y: 25 }, 
        bodyEdge: { x: 25, y: 25 },
        angle: 0
      },
      { 
        number: '2', 
        name: 'K', 
        type: PinType.PASSIVE, 
        connectionPoint: { x: 100, y: 25 }, 
        bodyEdge: { x: 65, y: 25 },
        angle: 180
      },
    ],
    geometry: {
      rectangles: [],
      polylines: [
        { points: [{ x: 0, y: 25 }, { x: 25, y: 25 }] }, // Anode stub
        { points: [{ x: 25, y: 10 }, { x: 25, y: 40 }, { x: 55, y: 25 }, { x: 25, y: 10 }] }, // Triangle
        { points: [{ x: 55, y: 10 }, { x: 55, y: 40 }] }, // Cathode bar
        { points: [{ x: 55, y: 25 }, { x: 100, y: 25 }] }, // Cathode stub
      ],
      circles: [],
      arcs: [],
    },
    properties: {
      reference: 'D',
      value: 'RED',
      footprint: 'LED0603',
      datasheet: '',
    },
    boundingBox: { x: 0, y: 10, width: 100, height: 30 },
  },
  ic: {
    id: 'ic',
    pins: [
      { 
        number: '1', 
        name: 'IN', 
        type: PinType.INPUT, 
        connectionPoint: { x: 0, y: 20 }, 
        bodyEdge: { x: 40, y: 20 },
        angle: 0
      },
      { 
        number: '2', 
        name: 'GND', 
        type: PinType.POWER_IN, 
        connectionPoint: { x: 0, y: 60 }, 
        bodyEdge: { x: 40, y: 60 },
        angle: 0
      },
      { 
        number: '3', 
        name: 'OUT', 
        type: PinType.OUTPUT, 
        connectionPoint: { x: 160, y: 20 }, 
        bodyEdge: { x: 120, y: 20 },
        angle: 180
      },
      { 
        number: '4', 
        name: 'VCC', 
        type: PinType.POWER_IN, 
        connectionPoint: { x: 160, y: 60 }, 
        bodyEdge: { x: 120, y: 60 },
        angle: 180
      },
    ],
    geometry: {
      rectangles: [{ start: { x: 40, y: 0 }, end: { x: 120, y: 80 } }],
      polylines: [
        { points: [{ x: 0, y: 20 }, { x: 40, y: 20 }] },
        { points: [{ x: 0, y: 60 }, { x: 40, y: 60 }] },
        { points: [{ x: 120, y: 20 }, { x: 160, y: 20 }] },
        { points: [{ x: 120, y: 60 }, { x: 160, y: 60 }] },
      ],
      circles: [],
      arcs: [],
    },
    properties: {
      reference: 'U',
      value: 'IC',
      footprint: 'DIP8',
      datasheet: '',
    },
    boundingBox: { x: 0, y: 0, width: 160, height: 80 },
  },
}
