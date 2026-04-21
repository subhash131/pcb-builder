import { ErcRule } from '../ErcRule'
import { Netlist } from '../../Netlist'
import { ErcViolation, Severity, PinType } from '../../../types'

export class FloatingPinRule extends ErcRule {
  readonly name = 'floating-input'
  readonly description = 'Input pin not connected to any net'

  check(netlist: Netlist): ErcViolation[] {
    return netlist.getAllPins()
      .filter(pin => pin.type === PinType.INPUT)
      .filter(pin => netlist.getPinNet(pin.ref) === null)
      .map(pin => ({
        rule: this.name,
        severity: Severity.WARNING,
        message: `Input pin "${pin.ref}" is unconnected`,
        affectedPins: [pin.ref],
        componentRef: pin.componentRef,
      }))
  }
}
