import { ErcViolation } from '../../types'
import { Netlist } from '../Netlist'

export abstract class ErcRule {
  abstract readonly name: string
  abstract readonly description: string
  abstract check(netlist: Netlist): ErcViolation[]
}
