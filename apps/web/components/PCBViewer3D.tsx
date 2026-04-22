'use client'

import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { useQuery } from 'convex/react'
import { api } from '@workspace/backend/_generated/api'
import { Id } from '@workspace/backend/_generated/dataModel'
import { Box, Loader2 } from 'lucide-react'

import { PCBScene } from './pcb3d/PCBScene'
import { BoardStackup } from './pcb3d/BoardStackup'
import { Footprint3D } from './pcb3d/Footprint3D'
import { Trace3D } from './pcb3d/Trace3D'
import { ViewerControls } from './pcb3d/ViewerControls'

interface PCBViewer3DProps {
  schematicId: Id<"schematics">
}

export default function PCBViewer3D({ schematicId }: PCBViewer3DProps) {
  const board = useQuery(api.pcb.getBoardBySchematicId, { schematicId })
  const footprints = useQuery(api.pcb.getFootprints, board ? { boardId: board._id } : "skip")
  const traces = useQuery(api.pcb.getTraces, board ? { boardId: board._id } : "skip")

  const [visible, setVisible] = useState({
    substrate: true,
    topCopper: true,
    bottomCopper: true,
    soldermask: true,
    silkscreen: true,
    components: true,
  })

  const [cameraPreset, setCameraPreset] = useState('iso')

  if (!board) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-500 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="font-mono text-xs uppercase tracking-widest">Initializing 3D Engine...</p>
      </div>
    )
  }

  const bhw = board.boardWidth / 2
  const bhh = board.boardHeight / 2

  return (
    <div className="relative w-full h-full bg-[#050510]">
      <Suspense fallback={null}>
        <Canvas 
          shadows 
          camera={{ position: [200, 200, 200], fov: 40 }}
          dpr={[1, 2]} // Performance optimization for high-DPI screens
        >
          <PCBScene 
            boardWidthMm={board.boardWidth} 
            boardHeightMm={board.boardHeight} 
            cameraPreset={cameraPreset as any} 
          />

          <group>
            <BoardStackup 
              widthMm={board.boardWidth} 
              heightMm={board.boardHeight} 
              visible={visible} 
            />

            {visible.components && footprints?.map((f) => (
              <Footprint3D 
                key={f._id} 
                footprint={f} 
                showComponents={visible.components} 
                boardHalfW={bhw}
                boardHalfH={bhh}
              />
            ))}

            {traces?.map((t) => (
              <Trace3D 
                key={t._id} 
                trace={t} 
                boardHalfW={bhw} 
                boardHalfH={bhh} 
              />
            ))}
          </group>
        </Canvas>
      </Suspense>

      <ViewerControls 
        visible={visible} 
        setVisible={setVisible} 
        cameraPreset={cameraPreset} 
        setCameraPreset={setCameraPreset} 
      />

      {/* Stats Overlay */}
      <div className="absolute top-6 left-6 flex flex-col gap-1 pointer-events-none">
        <h3 className="text-white font-bold text-lg tracking-tight uppercase">3D Real-time Render</h3>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[10px]">
          <span className="flex items-center gap-1"><Box className="w-3 h-3" /> {footprints?.length || 0} Components</span>
          <span>•</span>
          <span>{traces?.length || 0} Copper Traces</span>
          <span>•</span>
          <span className="text-blue-400">{board.boardWidth}x{board.boardHeight}mm</span>
        </div>
      </div>
    </div>
  )
}
