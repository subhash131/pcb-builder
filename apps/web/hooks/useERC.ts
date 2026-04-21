import { useEffect } from 'react'
import { useSchematicStore } from '../store/useSchematicStore'
import {
  ErcEngine,
  OutputConflictRule,
  FloatingPinRule,
  UnconnectedNetRule,
} from '@workspace/core'

// engine is stable — created once
const ercEngine = new ErcEngine()
  .addRule(new OutputConflictRule())
  .addRule(new FloatingPinRule())
  .addRule(new UnconnectedNetRule())

export function useERC() {
  const netlist      = useSchematicStore(s => s.netlist)
  const netlistVersion = useSchematicStore(s => s.netlistVersion)
  const setErcReport = useSchematicStore(s => s.setErcReport)

  useEffect(() => {
    // debounce — don't run on every keystroke
    const timer = setTimeout(() => {
      const report = ercEngine.run(netlist)
      setErcReport(report)

      // Phase 1: log to console per verification plan
      if (report.errors > 0 || report.warnings > 0) {
        console.warn('[ERC]', report.errors, 'errors,', report.warnings, 'warnings')
        report.violations.forEach(v => console.warn(' →', v.severity, v.message))
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [netlist, netlistVersion, setErcReport])
}
