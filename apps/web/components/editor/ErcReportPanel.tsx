import { useState } from 'react'
import { useSchematicStore } from '../../store/useSchematicStore'
import { Severity } from '@workspace/core'
import { AlertTriangle, XCircle, ChevronDown, ChevronUp, CheckCircle, RefreshCw } from 'lucide-react'

export const ErcReportPanel = () => {
  const ercReport = useSchematicStore((s) => s.ercReport)
  const triggerERC = useSchematicStore((s) => s.triggerERC)
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  const handleRunCheck = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsScanning(true)
    triggerERC()
    // Small delay for visual feedback
    setTimeout(() => setIsScanning(false), 600)
  }

  if (!ercReport) return null

  const { errors, warnings, violations } = ercReport

  return (
    <div 
      className="fixed top-20 right-4 z-[1000] w-80 overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-md"
      style={{
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      }}
    >
      {/* Header / Summary Bar */}
      <div 
        className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {errors > 0 ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : warnings > 0 ? (
            <AlertTriangle className="h-5 w-5 text-amber-500" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
          <span className="font-bold text-slate-800">
            {errors > 0 || warnings > 0 ? 'Connectivity Issues' : 'Netlist OK'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {errors > 0 && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-600">
              {errors} E
            </span>
          )}
          {warnings > 0 && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-600">
              {warnings} W
            </span>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          
          <button
            onClick={handleRunCheck}
            disabled={isScanning}
            className={`flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase transition-all hover:bg-white/20 active:scale-95 disabled:opacity-50 ${isScanning ? 'text-blue-500' : 'text-slate-600'}`}
          >
            <RefreshCw className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Run Check'}
          </button>
        </div>
      </div>

      {/* Violation List */}
      {isExpanded && (
        <div className="max-h-96 overflow-y-auto border-t border-white/10 bg-black/5 p-2">
          {violations.length === 0 ? (
            <div className="py-4 text-center text-sm text-slate-500">
              No issues detected in current netlist.
            </div>
          ) : (
            <div className="space-y-2">
              {violations.map((v, i) => (
                <div 
                  key={i} 
                  className={`rounded-lg border p-2 text-xs transition-transform hover:scale-[1.02] ${
                    v.severity === Severity.ERROR 
                      ? 'border-red-500/30 bg-red-500/10 text-red-800' 
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      {v.severity === Severity.ERROR ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    </div>
                    <div>
                      <div className="font-bold underline decoration-dotted capitalize">
                        {v.rule.replace('-', ' ')}
                      </div>
                      <div className="mt-1 opacity-80">{v.message}</div>
                      {v.affectedPins.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {v.affectedPins.map(p => (
                            <span key={p} className="rounded bg-black/10 px-1 font-mono text-[9px]">
                              {p}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
