import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@workspace/backend/_generated/api'
import { Id } from '@workspace/backend/_generated/dataModel'
import { Settings2 } from 'lucide-react'

// PCB Presets in mm
export const PCB_PAGE_PRESETS = {
  'A5': { width: 210, height: 148, name: 'A5' },
  'A4': { width: 297, height: 210, name: 'A4' },
  'A3': { width: 420, height: 297, name: 'A3' },
  'A2': { width: 594, height: 420, name: 'A2' },
  'A1': { width: 841, height: 594, name: 'A1' },
  'A0': { width: 1189, height: 841, name: 'A0' },
  'ANSI A': { width: 279, height: 216, name: 'ANSI A' },
  'ANSI B': { width: 432, height: 279, name: 'ANSI B' },
  'Custom': { width: 100, height: 80, name: 'Custom' },
}

export function PCBSheetSettings({ boardId, currentPreset, currentWidth, currentHeight }: { 
  boardId: Id<"pcb_boards">,
  currentPreset?: string,
  currentWidth?: number,
  currentHeight?: number
}) {
  const [isOpen, setIsOpen] = useState(false)
  const updateBoard = useMutation(api.pcb.updateBoard)
  
  const preset = currentPreset || 'A4'
  const width = currentWidth || 297
  const height = currentHeight || 210

  const handlePresetChange = (p: string) => {
    const data = PCB_PAGE_PRESETS[p as keyof typeof PCB_PAGE_PRESETS]
    if (data) {
      updateBoard({ id: boardId, width: data.width, height: data.height, preset: p })
    } else if (p === 'Custom') {
      updateBoard({ id: boardId, width, height, preset: 'Custom' })
    }
  }

  const handleCustomSize = (w: number, h: number) => {
    updateBoard({ id: boardId, width: w, height: h, preset: 'Custom' })
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ae40a5] text-white shadow-lg hover:bg-[#c44db9] transition-all border border-[#ae40a5]/20"
        title="PCB Sheet Settings"
      >
        <Settings2 size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-12 left-0 w-64 rounded-xl border border-[#ae40a5]/20 bg-[#00050b] p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-2 border-l-4 border-l-[#ae40a5]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#ae40a5] text-sm tracking-tight">PCB Layout Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold text-[#ae40a5]/60 uppercase tracking-widest">Page Preset</label>
              <select 
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="w-full rounded-lg border border-[#ae40a5]/20 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#ae40a5]/20 focus:border-[#ae40a5] bg-[#00050b] text-[#ae40a5] appearance-none cursor-pointer"
              >
                {Object.keys(PCB_PAGE_PRESETS).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {(preset === 'Custom' || !PCB_PAGE_PRESETS[preset as keyof typeof PCB_PAGE_PRESETS]) && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#ae40a5]/60">Width (mm)</label>
                  <input 
                    type="number" 
                    value={width}
                    onChange={(e) => handleCustomSize(Number(e.target.value), height)}
                    className="w-full rounded-lg border border-[#ae40a5]/20 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ae40a5] bg-[#00050b] text-[#ae40a5]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-[#ae40a5]/60">Height (mm)</label>
                  <input 
                    type="number" 
                    value={height}
                    onChange={(e) => handleCustomSize(width, Number(e.target.value))}
                    className="w-full rounded-lg border border-[#ae40a5]/20 p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#ae40a5] bg-[#00050b] text-[#ae40a5]"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-start gap-2 border-t border-[#ae40a5]/10 mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-[#ae40a5] mt-1" />
              <p className="text-[10px] text-[#ae40a5]/40 leading-tight">
                PCB Layout uses mm units.<br/> 
                Frame is for visual guidance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
