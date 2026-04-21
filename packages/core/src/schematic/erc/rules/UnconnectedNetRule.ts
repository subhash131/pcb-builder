import { ErcRule } from '../ErcRule'
import { Netlist } from '../../Netlist'
import { ErcViolation, Severity } from '../../../types'

export class UnconnectedNetRule extends ErcRule {
  readonly name = 'unconnected-net'
  readonly description = 'Net has only one pin connected'

  check(netlist: Netlist): ErcViolation[] {
    return netlist.getNetIds().flatMap(netId => {
      const pins = netlist.getPinsOnNet(netId)
      if (pins.length === 1) {
        return [{
          rule: this.name,
          severity: Severity.WARNING,
          message: `Net "${netId}" has only one connection (pin "${pins[0]?.ref}")`,
          affectedPins: pins.map(p => p.ref),
          netId,
        }]
      }
      return []
    })
  }
}
