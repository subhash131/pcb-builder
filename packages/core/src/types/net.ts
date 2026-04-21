import { PinType } from './pin'
import Graph from 'graphology'

export enum NetStatus {
  OK       = 'ok',
  CONFLICT = 'conflict',    // multiple drivers
  FLOATING = 'floating',    // inputs only, no driver
  EMPTY    = 'empty',       // no pins at all
}

export enum Severity {
  ERROR   = 'error',
  WARNING = 'warning',
  INFO    = 'info',
}

export interface ErcViolation {
  rule: string
  severity: Severity
  message: string
  affectedPins: string[]
  netId?: string
  componentRef?: string
}

export interface ErcReport {
  violations: ErcViolation[]
  errors: number
  warnings: number
  timestamp: number
  hasErrors: () => boolean
}

// graphology node types — explicit, not any
export interface ComponentNode {
  kind: 'component'
  ref: string           // "R1"
  symbolId: string      // "R"
  footprintId: string
}

export interface PinNode {
  kind: 'pin'
  ref: string           // "R1.1"
  componentRef: string  // "R1"
  pinNumber: string     // "1"
  pinName: string       // "~", "VCC", "GND"
  type: PinType         // the critical field
}

export interface NetNode {
  kind: 'net'
  netId: string         // "net_001", "VCC", "GND"
  name: string
}

// graphology typed graph
export type NetlistGraph = Graph<
  ComponentNode | PinNode | NetNode,
  { kind: 'pin-to-net' | 'pin-to-component' }
>
