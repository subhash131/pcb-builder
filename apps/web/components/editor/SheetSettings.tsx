import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@workspace/backend/_generated/api'
import { Id } from '@workspace/backend/_generated/dataModel'
import { PAGE_PRESETS } from '../SchematicEditor'
import { Settings2 } from 'lucide-react'

export function SheetSettings({ schematicId, currentPreset, currentWidth, currentHeight }: { 
  schematicId: Id<"schematics">,
  currentPreset?: string,
  currentWidth?: number,
  currentHeight?: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const updateSheet = useMutation(api.schematics.updateSheet)
  
  const preset = currentPreset || 'A4'
  const width = currentWidth || 2970
  const height = currentHeight || 2100

  const handlePresetChange = (p: string) => {
    const data = PAGE_PRESETS[p as keyof typeof PAGE_PRESETS]
    if (data) {
      updateSheet({ id: schematicId, width: data.width, height: data.height, preset: p })
    } else if (p === 'Custom') {
      updateSheet({ id: schematicId, width, height, preset: 'Custom' })
    }
  }

  const handleCustomSize = (w: number, h: number) => {
    updateSheet({ id: schematicId, width: w, height: h, preset: 'Custom' })
  }

  return (
    <div className="fixed bottom-4 left-4 z-9999">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg hover:bg-slate-50 transition-all border border-slate-200"
        title="Sheet Settings"
      >
        <Settings2 size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-12 left-0 w-64 rounded-xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">Sheet Settings</h3>
            
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page Preset</label>
              <select 
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 appearance-none cursor-pointer"
              >
                {Object.keys(PAGE_PRESETS).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {(preset === 'Custom' || !PAGE_PRESETS[preset as keyof typeof PAGE_PRESETS]) && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-slate-500">Width (10th mm)</label>
                  <input 
                    type="number" 
                    value={width}
                    onChange={(e) => handleCustomSize(Number(e.target.value), height)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-slate-500">Height (10th mm)</label>
                  <input 
                    type="number" 
                    value={height}
                    onChange={(e) => handleCustomSize(width, Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-start gap-2 border-t border-slate-100 mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1" />
              <p className="text-[10px] text-slate-400 leading-tight">
                Canvas units are 0.1 mm. <br/> 
                Standard A4 is 2970 &times; 2100.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
