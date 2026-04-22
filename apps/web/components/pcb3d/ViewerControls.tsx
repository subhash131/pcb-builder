'use client'

import { Layout, Cpu, Box, Camera, Eye, EyeOff, Layers } from 'lucide-react'

interface ViewerControlsProps {
  visible: {
    substrate: boolean
    topCopper: boolean
    bottomCopper: boolean
    soldermask: boolean
    silkscreen: boolean
    components: boolean
  }
  setVisible: (val: any) => void
  cameraPreset: string
  setCameraPreset: (val: string) => void
}

export function ViewerControls({ visible, setVisible, cameraPreset, setCameraPreset }: ViewerControlsProps) {
  const toggle = (key: string) => {
    setVisible((prev: any) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10 pointer-events-none">
      {/* Layer Toggles */}
      <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-1 rounded-xl shadow-2xl pointer-events-auto">
        <ControlButton 
          active={visible.substrate} 
          onClick={() => toggle('substrate')} 
          label="Board" 
          icon={<Box className="w-4 h-4" />} 
        />
        <ControlButton 
          active={visible.topCopper} 
          onClick={() => toggle('topCopper')} 
          label="F.Cu" 
          icon={<Cpu className="w-4 h-4 text-amber-500" />} 
        />
        <ControlButton 
          active={visible.bottomCopper} 
          onClick={() => toggle('bottomCopper')} 
          label="B.Cu" 
          icon={<Cpu className="w-4 h-4 text-blue-500" />} 
        />
        <ControlButton 
          active={visible.soldermask} 
          onClick={() => toggle('soldermask')} 
          label="Mask" 
          icon={<Layers className="w-4 h-4 text-green-500" />} 
        />
        <ControlButton 
          active={visible.components} 
          onClick={() => toggle('components')} 
          label="Comp" 
          icon={<Layout className="w-4 h-4" />} 
        />
      </div>

      {/* Camera Presets */}
      <div className="flex items-center gap-1 bg-slate-950/60 backdrop-blur-sm border border-slate-800 p-1 rounded-lg pointer-events-auto shadow-lg">
        {['iso', 'top', 'bottom', 'front', 'side'].map((p) => (
          <button
            key={p}
            onClick={() => setCameraPreset(p)}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
              cameraPreset === p 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function ControlButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
        active 
          ? 'bg-slate-800 text-blue-400 shadow-inner' 
          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium uppercase tracking-tight">{label}</span>
      {active ? <Eye className="w-3 h-3 mt-0.5 opacity-50" /> : <EyeOff className="w-3 h-3 mt-0.5 opacity-30" />}
    </button>
  )
}
