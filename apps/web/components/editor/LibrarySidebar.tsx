import { SymbolType } from '@workspace/core'

interface LibrarySidebarProps {
  onAddComponent: (type: SymbolType) => void
}

export function LibrarySidebar({ onAddComponent }: LibrarySidebarProps) {
  return (
    <div className="absolute bottom-26 left-4 z-1000 flex flex-col gap-2 p-2 bg-white/80 backdrop-blur rounded-lg shadow-lg border border-slate-200">
      <div className="text-xs font-bold text-slate-500 px-2 pb-1 uppercase tracking-wider">Library</div>
      <button 
        onClick={() => onAddComponent('resistor')} 
        className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left"
      >
        + Resistor
      </button>
      <button 
        onClick={() => onAddComponent('capacitor')} 
        className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left"
      >
        + Capacitor
      </button>
      <button 
        onClick={() => onAddComponent('led')} 
        className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left"
      >
        + LED
      </button>
      <button 
        onClick={() => onAddComponent('ic')} 
        className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded hover:bg-black transition text-left"
      >
        IC
      </button>

      <div className="h-px bg-slate-200 my-1" />

      <button 
        onClick={() => onAddComponent('74HC08')} 
        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition text-left uppercase"
      >
        74HC08 (AND)
      </button>
      <button 
        onClick={() => onAddComponent('74HC32')} 
        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition text-left uppercase"
      >
        74HC32 (OR-Chip)
      </button>

      <div className="h-px bg-slate-200 my-1" />

      <button 
        onClick={() => onAddComponent('and_gate')} 
        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition text-left uppercase"
      >
        AND Gate (Logic)
      </button>
      <button 
        onClick={() => onAddComponent('or_gate')} 
        className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 transition text-left uppercase"
      >
        OR Gate (Logic)
      </button>

      <div className="h-px bg-slate-200 my-1" />

      <button 
        onClick={() => onAddComponent('capacitor_100n')} 
        className="px-4 py-2 bg-slate-700 text-white text-xs font-medium rounded hover:bg-black transition text-left"
      >
        100nF Cap
      </button>
      <button 
        onClick={() => onAddComponent('switch')} 
        className="px-4 py-2 bg-slate-700 text-white text-xs font-medium rounded hover:bg-black transition text-left"
      >
        Switch
      </button>
      <button 
        onClick={() => onAddComponent('resistor_10k')} 
        className="px-4 py-2 bg-slate-700 text-white text-xs font-medium rounded hover:bg-black transition text-left"
      >
        10kΩ Res
      </button>
      <button 
        onClick={() => onAddComponent('resistor_470')} 
        className="px-4 py-2 bg-slate-700 text-white text-xs font-medium rounded hover:bg-black transition text-left"
      >
        470Ω Res
      </button>
      <button 
        onClick={() => onAddComponent('led_green')} 
        className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition text-left"
      >
        Green LED
      </button>
      <button 
        onClick={() => onAddComponent('led_yellow')} 
        className="px-4 py-2 bg-yellow-500 text-white text-xs font-bold rounded hover:bg-yellow-600 transition text-left"
      >
        Yellow LED
      </button>
    </div>
  )
}
