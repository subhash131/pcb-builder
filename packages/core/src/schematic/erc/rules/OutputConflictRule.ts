import { ErcRule } from '../ErcRule'
import { Netlist } from '../../Netlist'
import { ErcViolation, Severity, PinType } from '../../../types'

export class OutputConflictRule extends ErcRule {
  readonly name = 'output-conflict'
  readonly description = 'Multiple output pins on the same net'

  check(netlist: Netlist): ErcViolation[] {
    return netlist.getNetIds().flatMap(netId => {
      const pins = netlist.getPinsOnNet(netId)
      const drivers = pins.filter(p =>
        p.type === PinType.OUTPUT || p.type === PinType.POWER_OUT
      )
      if (drivers.length > 1) {
        return [{
          rule: this.name,
          severity: Severity.ERROR,
          message: `Net "${netId}" has ${drivers.length} conflicting output drivers`,
          affectedPins: drivers.map(p => p.ref),
          netId,
        }]
      }
      return []
    })
  }
}
