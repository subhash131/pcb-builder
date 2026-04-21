import { Netlist } from '../src/schematic/Netlist'
import { ErcEngine } from '../src/schematic/erc/ErcEngine'
import { OutputConflictRule } from '../src/schematic/erc/rules/OutputConflictRule'
import { FloatingPinRule } from '../src/schematic/erc/rules/FloatingPinRule'
import { PinType, Severity } from '../src/types'

const netlist = new Netlist()

// add two components with OUTPUT pins on same net → CONFLICT
netlist.addComponent('U1', 'IC', 'TQFP-32')
netlist.addPin('U1', '1', 'OUT', PinType.OUTPUT)

netlist.addComponent('U2', 'IC', 'TQFP-32')
netlist.addPin('U2', '1', 'OUT', PinType.OUTPUT)

netlist.assignNet('U1.1', 'net_conflict')
netlist.assignNet('U2.1', 'net_conflict')

// add INPUT + OUTPUT on same net → OK
netlist.addComponent('R1', 'R', 'R_0805')
netlist.addPin('R1', '1', '~', PinType.PASSIVE)
netlist.addPin('R1', '2', '~', PinType.PASSIVE)

netlist.addComponent('U3', 'IC', 'TQFP-32')
netlist.addPin('U3', '1', 'IN', PinType.INPUT)

netlist.assignNet('R1.1', 'net_ok')
netlist.assignNet('U3.1', 'net_ok')

// floating input — U3 pin 2 never assigned a net
netlist.addPin('U3', '2', 'IN2', PinType.INPUT)

const engine = new ErcEngine()
  .addRule(new OutputConflictRule())
  .addRule(new FloatingPinRule())

const report = engine.run(netlist)

console.assert(report.errors === 1,   `Expected 1 error, got ${report.errors}`)
console.assert(report.warnings >= 1,  `Expected warnings, got ${report.warnings}`)
console.assert(
  report.violations.some(v => v.rule === 'output-conflict' && v.netId === 'net_conflict'),
  'Expected output-conflict on net_conflict'
)
console.assert(
  report.violations.some(v => v.rule === 'floating-input' && v.affectedPins.includes('U3.2')),
  'Expected floating-input on U3.2'
)

console.log('✅ All ERC assertions passed')
console.log('Violations:', report.violations)
