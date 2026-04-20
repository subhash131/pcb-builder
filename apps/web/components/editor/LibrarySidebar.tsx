interface LibrarySidebarProps {
  onAddComponent: (type: 'resistor' | 'capacitor' | 'led') => void
}

export function LibrarySidebar({ onAddComponent }: LibrarySidebarProps) {
  return (
    <div className="absolute top-12 left-4 z-1000 flex flex-col gap-2 p-2 bg-white/80 backdrop-blur rounded-lg shadow-lg border border-slate-200">
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
    </div>
  )
}
