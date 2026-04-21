import { ErcRule } from './ErcRule'
import { Netlist } from '../Netlist'
import { ErcReport, Severity } from '../../types'

export class ErcEngine {
  private rules: ErcRule[] = []

  addRule(rule: ErcRule): this {
    this.rules.push(rule)
    return this     // fluent API
  }

  removeRule(name: string): this {
    this.rules = this.rules.filter(r => r.name !== name)
    return this
  }

  run(netlist: Netlist): ErcReport {
    const violations = this.rules.flatMap(rule => {
      try {
        return rule.check(netlist)
      } catch (e) {
        // rule crash never breaks the editor
        console.error(`ERC rule "${rule.name}" threw:`, e)
        return []
      }
    })

    const errors   = violations.filter(v => v.severity === Severity.ERROR).length
    const warnings = violations.filter(v => v.severity === Severity.WARNING).length

    return {
      violations,
      errors,
      warnings,
      timestamp: Date.now(),
      hasErrors: () => errors > 0,
    }
  }
}
