import { Tldraw, useEditor, track, Editor, TLShapePartial, TLRecord, TLShapeId, TLShape, TLParentId } from 'tldraw'
import 'tldraw/tldraw.css'
import { useQuery, useMutation } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { Id } from "@workspace/backend/_generated/dataModel"
import { useEffect, useMemo, useRef, useCallback, createContext, useContext } from 'react'

import { FootprintShape, FootprintShapeUtil } from './editor/pcb/FootprintShapeUtil'
import { RatsnestShapeUtil } from './editor/pcb/RatsnestShapeUtil'
import { computeRatsnest } from '../lib/pcb-logic'
import { NetlistReconstructor, mmToPx, pxToMm } from '@workspace/core'
import { PCBSheetSettings } from './editor/PCBSheetSettings'

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
  debounced.cancel = () => clearTimeout(timeoutId)
  return debounced
}

const shapeUtils = [FootprintShapeUtil, RatsnestShapeUtil]

const PCBContext = createContext<Id<"schematics"> | null>(null)

const KiCadPCBSheet = track(() => {
  const schematicId = useContext(PCBContext)
  const board = useQuery(api.pcb.getBoardBySchematicId, schematicId ? { schematicId } : "skip")
  
  if (!board) return null

  const width = mmToPx(board.boardWidth)
  const height = mmToPx(board.boardHeight)
  
  const FRAME_COLOR = '#444444' // Subtle dark frame
  const BOARD_COLOR = '#0a2a1a' // Deep green solder mask
  const COPPER_COLOR = '#c8a020'
  const TEXT_COLOR = '#cccccc'
  
  const MARGIN = mmToPx(10)
  const FRAME_W = mmToPx(4)
  
  const innerW = width - (MARGIN * 2)
  const innerH = height - (MARGIN * 2)
  const usableW = innerW - FRAME_W * 2
  const usableH = innerH - FRAME_W * 2
  
  const DIVISION_SIZE = mmToPx(50)
  const hParts = Math.round(usableW / DIVISION_SIZE)
  const vParts = Math.round(usableH / DIVISION_SIZE)

  return (
    <div
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: 0,
        top: 0,
        width,
        height,
        backgroundColor: BOARD_COLOR,
        border: `2px solid #111`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        boxSizing: 'border-box'
      }}
    >
      {/* Subtle Grid overlay for the whole board */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(circle at 1px 1px, #1a2230 1px, transparent 0)`,
        backgroundSize: `${mmToPx(2.54)}px ${mmToPx(2.54)}px`, // 100mil grid
        opacity: 0.3
      }} />

      {/* Outer technical Frame */}
      <div style={{
        position: 'absolute',
        left: MARGIN,
        top: MARGIN,
        width: innerW,
        height: innerH,
        border: `2px solid ${FRAME_COLOR}`,
        boxSizing: 'border-box'
      }} />

      {/* Inner Frame */}
      <div style={{
        position: 'absolute',
        left: MARGIN + FRAME_W,
        top: MARGIN + FRAME_W,
        width: usableW,
        height: usableH,
        border: `1px solid ${FRAME_COLOR}44`,
        boxSizing: 'border-box'
      }} />

      {/* Horizontal Labels */}
      {Array.from({ length: hParts }).map((_, i) => {
        const xPos = MARGIN + FRAME_W + (usableW / hParts) * (i + 0.5)
        const labelStyle: React.CSSProperties = {
          position: 'absolute',
          left: xPos,
          transform: 'translateX(-50%) translateY(-50%)',
          color: FRAME_COLOR,
          fontFamily: 'monospace',
          fontSize: 22,
          fontWeight: 'bold'
        }
        return (
          <div key={`h-${i}`}>
            <div style={{ ...labelStyle, top: MARGIN + (FRAME_W / 2) }}>{i + 1}</div>
            <div style={{ ...labelStyle, bottom: MARGIN + (FRAME_W / 2), transform: 'translateX(-50%) translateY(50%)' }}>{i + 1}</div>
          </div>
        )
      })}

      {/* Vertical Labels */}
      {Array.from({ length: vParts }).map((_, i) => {
        const yPos = MARGIN + FRAME_W + (usableH / vParts) * (i + 0.5)
        const labelStyle: React.CSSProperties = {
          position: 'absolute',
          top: yPos,
          transform: 'translateY(-50%) translateX(-50%)',
          color: FRAME_COLOR,
          fontFamily: 'monospace',
          fontSize: 22,
          fontWeight: 'bold'
        }
        return (
          <div key={`v-${i}`}>
            <div style={{ ...labelStyle, left: MARGIN + (FRAME_W / 2) }}>{String.fromCharCode(65 + i)}</div>
            <div style={{ ...labelStyle, right: MARGIN + (FRAME_W / 2), transform: 'translateY(-50%) translateX(50%)' }}>{String.fromCharCode(65 + i)}</div>
          </div>
        )
      })}

      {/* Title Block */}
      <div 
        style={{
          position: 'absolute',
          bottom: MARGIN + FRAME_W + 10,
          right: MARGIN + FRAME_W + 10,
          width: 320,
          height: 140,
          border: `1px solid ${FRAME_COLOR}`,
          padding: 12,
          color: TEXT_COLOR,
          fontFamily: 'monospace',
          fontSize: 12,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#000000cc',
          borderLeft: `4px solid ${COPPER_COLOR}`,
          backdropFilter: 'blur(4px)'
        }}
      >
        <div style={{ borderBottom: `1px solid #333`, paddingBottom: 4, marginBottom: 8, fontSize: 16, fontWeight: 'bold', color: COPPER_COLOR }}>
          P. PROTOTYPE v1.0
        </div>
        <div>Layer Count: {board.layers}</div>
        <div>Board ID: {board._id.substring(0, 8)}...</div>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
          <span>{Math.round(board.boardWidth)} x {Math.round(board.boardHeight)} mm</span>
          <span>{new Date(board.updatedAt || 0).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  )
})

const PCBEditorUI = track(({ schematicId }: { schematicId: Id<"schematics"> }) => {
  const editor = useEditor()
  
  const schematicRecords = useQuery(api.schematics.getRecords, { schematicId })
  const netlist = useMemo(() => {
    if (!schematicRecords) return null
    return NetlistReconstructor.reconstruct(schematicRecords.shapes)
  }, [schematicRecords])
  
  const board = useQuery(api.pcb.getBoardBySchematicId, { schematicId })
  const footprints = useQuery(api.pcb.getFootprints, board ? { boardId: board._id } : "skip")
  const updateFootprints = useMutation(api.pcb.updateFootprints)
  const deleteFootprints = useMutation(api.pcb.deleteFootprints)

  // Track pending updates to avoid cursor fighting
  const pendingUpdates = useRef<Map<TLShapeId, { x: number, y: number, rotation: number }>>(new Map())

  // 1. Sync Footprints from Convex to tldraw (Smart Sync)
  useEffect(() => {
    if (!footprints) return
    
    editor.run(() => {
      const shapesToCreate: TLShapePartial<FootprintShape>[] = []
      const shapesToUpdate: TLShapePartial<FootprintShape>[] = []
      
      footprints.forEach(f => {
        const id = `shape:footprint-${f._id}` as TLShapeId
        
        // Skip if user is currently interacting with this shape or we have pending local changes
        if (pendingUpdates.current.has(id)) return
        if (editor.getSelectedShapeIds().includes(id)) return // Basic heuristic: don't overwrite selected shapes

        // Resolve footprintId to match our registry
        let defKey = f.footprintId;
        if (defKey.startsWith('C')) {
          if (defKey.includes('0603')) defKey = 'C0603';
          else if (defKey.includes('0805')) defKey = 'C0805';
        } else if (defKey.startsWith('LED')) {
          if (defKey.includes('0603')) defKey = 'LED0603';
          else if (defKey.includes('0805')) defKey = 'LED0805';
        } else if (defKey.includes('0603')) {
          defKey = 'R0603';
        } else if (defKey.includes('0805')) {
          defKey = 'R0805';
        } else if (defKey.includes('DIP')) {
          defKey = 'DIP8';
        }

        // Resolve nets for each pad
        const netIds: Record<string, string | null> = {}
        if (netlist) {
          // Legacy: Handle footprints saved with shape IDs instead of designators
          let ref = f.componentRef
          if (ref.startsWith('shape:') && schematicRecords) {
            const sym = schematicRecords.shapes.find(s => s.tldrawId === ref)
            if (sym?.props?.designator) ref = sym.props.designator
          }

          const pins = netlist.getComponentPins(ref)
          pins.forEach(p => {
            const net = netlist.getPinNet(`${ref}.pin-${p.pinNumber}`)
            netIds[p.pinNumber] = net
          })
        }

        const shapeData = {
          id,
          type: 'footprint' as const,
          x: mmToPx(f.x),
          y: mmToPx(f.y),
          rotation: (f.rotation * Math.PI) / 180,
          props: {
            componentRef: f.componentRef,
            footprintId: defKey,
            layer: f.layer,
            netIds,
          }
        }

        if (editor.store.has(id)) {
          // Only update if actually different from what we want
          const current = editor.getShape(id)
          if (current && (
            Math.abs(current.x - shapeData.x) > 0.01 || 
            Math.abs(current.y - shapeData.y) > 0.01 ||
            Math.abs(current.rotation - shapeData.rotation) > 0.01
          )) {
            shapesToUpdate.push(shapeData)
          }
        } else {
          shapesToCreate.push(shapeData)
        }
      })

      // Remove footprints that are no longer in DB
      const currentFpIds = new Set(footprints.map(f => `shape:footprint-${f._id}`))
      const toDelete = editor.getCurrentPageShapes()
        .filter(s => s.type === 'footprint' && !currentFpIds.has(s.id))
        .map(s => s.id)

      if (shapesToCreate.length) editor.createShapes(shapesToCreate)
      if (shapesToUpdate.length) editor.updateShapes(shapesToUpdate)
      if (toDelete.length) editor.deleteShapes(toDelete)
    })
  }, [editor, footprints])

  // 2. Real-time Ratsnest (Computed from store)
  useEffect(() => {
    const updateRatsnest = () => {
      if (!footprints) return
      
      // Convert current store shapes back to the format computeRatsnest expects
      const currentFootprints = footprints.map((f, i) => {
        const shapeId = `shape:footprint-${f._id}` as TLShapeId
        const s = editor.getShape(shapeId) as FootprintShape | undefined
        
        let ref = s ? s.props.componentRef : f.componentRef
        // Legacy resolution for ratsnest
        if (ref.startsWith('shape:') && schematicRecords) {
          const sym = schematicRecords.shapes.find(s => s.tldrawId === ref)
          if (sym?.props?.designator) ref = sym.props.designator
        }

        return {
          ...f,
          index: `a${i}` as any,
          x: s ? pxToMm(s.x) : f.x,
          y: s ? pxToMm(s.y) : f.y,
          rotation: s ? (s.rotation * 180) / Math.PI : f.rotation,
          componentRef: ref,
        }
      })

      const ratsnestLines = netlist ? computeRatsnest(netlist, currentFootprints) : []
      
      const ratsnestId = 'shape:ratsnest' as TLShapeId
      const s = editor.getShape(ratsnestId)
      const data = {
        id: ratsnestId,
        index: (s?.index ?? 'a1') as any,
        type: 'ratsnest',
        x: 0,
        y: 0,
        props: {
          lines: ratsnestLines
        },
        isLocked: true,
      } satisfies TLShapePartial

      if (editor.store.has(ratsnestId)) {
        editor.updateShape(data)
      } else {
        editor.createShape(data)
      }
    }

    // Update initially and listen for store changes
    updateRatsnest()
    const cleanup = editor.store.listen(({ changes }) => {
      const isFp = (s: TLRecord): s is FootprintShape => s.typeName === 'shape' && (s as any).type === 'footprint'
      
      const hasFpChanges = 
        Object.values(changes.added).some(isFp) ||
        Object.values(changes.updated).some(([, next]) => isFp(next)) ||
        Object.values(changes.removed).some(isFp)

      if (hasFpChanges) {
        updateRatsnest()
      }
    }, { source: 'user', scope: 'document' })

    return () => cleanup()
  }, [editor, netlist, footprints])

  // 3. Persistence: Debounced Batch Push
  const pushUpdates = useMemo(() => debounce(async (updates: Array<{ id: Id<"pcb_footprints">, x: number, y: number, rotation: number }>) => {
    if (updates.length === 0) return
    console.log(`[PCB] Pushing ${updates.length} footprint updates to DB`)
    try {
      await updateFootprints({ updates })
      // Clear pending updates for these IDs
      updates.forEach(u => pendingUpdates.current.delete(`shape:footprint-${u.id}` as TLShapeId))
    } catch (err) {
      console.error("Failed to update footprints", err)
    }
  }, 500), [updateFootprints])
  
  const pushDeletions = useMemo(() => debounce(async (ids: Id<"pcb_footprints">[]) => {
    if (ids.length === 0) return
    console.log(`[PCB] Pushing ${ids.length} footprint deletions to DB`)
    try {
      await deleteFootprints({ ids })
    } catch (err) {
      console.error("Failed to delete footprints", err)
    }
  }, 500), [deleteFootprints])

  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      const updates: Array<{ id: Id<"pcb_footprints">, x: number, y: number, rotation: number }> = []
      const deletions: Id<"pcb_footprints">[] = []

      // Handle updates
      Object.entries(changes.updated).forEach(([id, [, next]]) => {
        if (next.typeName === 'shape' && (next as any).type === 'footprint') {
          const shape = next as FootprintShape
          const dbId = shape.id.replace('shape:footprint-', '') as Id<"pcb_footprints">
          updates.push({
            id: dbId,
            x: pxToMm(shape.x),
            y: pxToMm(shape.y),
            rotation: (shape.rotation * 180) / Math.PI
          })
          pendingUpdates.current.set(shape.id, { x: shape.x, y: shape.y, rotation: shape.rotation })
        }
      })

      // Handle deletions
      Object.values(changes.removed).forEach((shape) => {
        if (shape.typeName === 'shape' && (shape as any).type === 'footprint') {
          const dbId = shape.id.replace('shape:footprint-', '') as Id<"pcb_footprints">
          deletions.push(dbId)
        }
      })

      if (updates.length > 0) pushUpdates(updates)
      if (deletions.length > 0) pushDeletions(deletions)
    }, { source: 'user', scope: 'document' })

    return () => {
      cleanup()
      pushUpdates.cancel()
    }
  }, [editor, pushUpdates])

  // 4. CAMERA PERSISTENCE: Download
  const cameraRestored = useRef(false)
  useEffect(() => {
    if (!board || cameraRestored.current) return
    if (board.cameraX !== undefined && board.cameraY !== undefined && board.cameraZoom !== undefined) {
      editor.setCamera({ x: board.cameraX, y: board.cameraY, z: board.cameraZoom })
    }
    cameraRestored.current = true
  }, [editor, board])

  // 5. CAMERA PERSISTENCE: Upload (Debounced)
  const updateCamera = useMutation(api.pcb.updateCamera)
  const pushCamera = useMemo(() => debounce(async (cam: { x: number, y: number, z: number }) => {
    if (!board) return
    try {
      await updateCamera({ id: board._id, x: cam.x, y: cam.y, zoom: cam.z })
    } catch (err) {
      console.error("Failed to sync PCB camera", err)
    }
  }, 1000), [updateCamera, board?._id])

  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      const hasCameraChanges = Object.values(changes.updated).some(([, next]) => 
        next.typeName === 'camera' || next.typeName === 'instance'
      )
      
      if (hasCameraChanges) {
        const cam = editor.getCamera()
        pushCamera(cam)
      }
    })

    return () => {
      cleanup()
      pushCamera.cancel()
    }
  }, [editor, pushCamera])

  // 6. Enable Grid
  useEffect(() => {
    editor.updateInstanceState({ isGridMode: true })
  }, [editor])

  return (
    <>
      {board && (
        <PCBSheetSettings 
          boardId={board._id}
          currentPreset={board.boardPreset}
          currentWidth={board.boardWidth}
          currentHeight={board.boardHeight}
        />
      )}
    </>
  )
})

export default function PCBEditor({ schematicId }: { schematicId: Id<"schematics"> }) {
  return (
    <div className="fixed inset-0 bg-[#00050b]" style={{ '--color-grid': '#1a2230' } as React.CSSProperties}>
      <PCBContext.Provider value={schematicId}>
        <Tldraw 
          shapeUtils={shapeUtils} 
          inferDarkMode={true}
          components={{
            OnTheCanvas: KiCadPCBSheet,
            Toolbar: null,
            StylePanel: null,
            PageMenu: null,
            MainMenu: null,
            ActionsMenu: null,
            HelpMenu: null,
          }}
        >
          <PCBEditorUI schematicId={schematicId} />
        </Tldraw>
      </PCBContext.Provider>
    </div>
  )
}
