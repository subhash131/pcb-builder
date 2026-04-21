import { Tldraw, useEditor, TLShape, TLShapeId, TLRecord, TLParentId } from 'tldraw'
import 'tldraw/tldraw.css'
import { SymbolShapeUtil } from './editor/SymbolShape'
import { WireShapeUtil } from './editor/WireShape'
import { useSchematicStore } from '../store/useSchematicStore'
import { useNetlistSync } from '../hooks/useNetlistSync'
import { useLibraryActions } from '../hooks/useLibraryActions'
import { useSchematicInteraction } from '../hooks/useSchematicInteraction'
import { useERC } from '../hooks/useERC'
import { useSymbolSync } from '../hooks/useSymbolSync'
import { LibrarySidebar } from './editor/LibrarySidebar'
import { ProximityHotspot } from './editor/ProximityHotspot'
import { useQuery, useMutation } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { Id } from "@workspace/backend/_generated/dataModel"
import { createContext, useContext, useEffect, useRef, useMemo } from 'react'

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let timeoutId: ReturnType<typeof setTimeout>
  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
  debounced.cancel = () => clearTimeout(timeoutId)
  return debounced
}
import { SheetSettings } from './editor/SheetSettings'
import { ErcReportPanel } from './editor/ErcReportPanel'

const SchematicContext = createContext<Id<"schematics"> | null>(null)

const shapeUtils = [SymbolShapeUtil, WireShapeUtil]

import { mmToPx } from '@workspace/core'

export const PAGE_PRESETS = {
  'A5': { width: 210, height: 148, name: 'A5' },
  'A4': { width: 297, height: 210, name: 'A4' },
  'A3': { width: 420, height: 297, name: 'A3' },
  'A2': { width: 594, height: 420, name: 'A2' },
  'A1': { width: 841, height: 594, name: 'A1' },
  'A0': { width: 1189, height: 841, name: 'A0' },
  'ANSI A': { width: 279, height: 216, name: 'ANSI A' },
  'ANSI B': { width: 432, height: 279, name: 'ANSI B' },
  'ANSI C': { width: 559, height: 432, name: 'ANSI C' },
  'ANSI D': { width: 864, height: 559, name: 'ANSI D' },
  'ANSI E': { width: 1118, height: 864, name: 'ANSI E' },
  'Custom': { width: 297, height: 210, name: 'Custom' },
}

const KiCadSheet = () => {
  const schematicId = useContext(SchematicContext)
  const schematic = useQuery(api.schematics.getById, schematicId ? { id: schematicId } : "skip")

  if (!schematicId) return null

  let rawWidth = schematic?.sheetWidth ?? 297
  let rawHeight = schematic?.sheetHeight ?? 210
  const presetName = schematic?.sheetPreset ?? 'A4'

  // Migration: If detecting old 0.1mm units (e.g. 2970), convert to mm
  if (rawWidth > 1500) rawWidth = rawWidth / 10
  if (rawHeight > 1500) rawHeight = rawHeight / 10

  const PAGE_W = mmToPx(rawWidth, 'schematic')
  const PAGE_H = mmToPx(rawHeight, 'schematic')
  const MARGIN = mmToPx(10, 'schematic') // 10mm margin
  const FRAME_W = mmToPx(4, 'schematic')  // 4mm label frame
  
  // 1 division = 50 mm
  const DIVISION_SIZE = mmToPx(50, 'schematic') 
  const innerW = PAGE_W - (MARGIN * 2)
  const innerH = PAGE_H - (MARGIN * 2)
  const usableW = innerW - FRAME_W * 2
  const usableH = innerH - FRAME_W * 2
  const hParts = Math.round(usableW / DIVISION_SIZE)
  const vParts = Math.round(usableH / DIVISION_SIZE)

  return (
    <div
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        left: 0,
        top: 0,
        width: PAGE_W,
        height: PAGE_H,
        border: '2px dashed #d0d0d0', // Physical sheet edge
        boxSizing: 'border-box'
      }}
    >
      {/* Outer Frame Line */}
      <div style={{
        position: 'absolute',
        left: MARGIN,
        top: MARGIN,
        width: PAGE_W - (MARGIN * 2),
        height: PAGE_H - (MARGIN * 2),
        border: '3px solid #cc0000',
        boxSizing: 'border-box'
      }} />

      {/* Inner Frame Line */}
      <div style={{
        position: 'absolute',
        left: MARGIN + FRAME_W,
        top: MARGIN + FRAME_W,
        width: PAGE_W - (MARGIN * 2) - (FRAME_W * 2),
        height: PAGE_H - (MARGIN * 2) - (FRAME_W * 2),
        border: '1px solid #cc0000',
        boxSizing: 'border-box'
      }} />

      {/* Horizontal Scale Labels */}
      {Array.from({ length: hParts }).map((_, i) => {
        const xPos = MARGIN + FRAME_W + ((innerW - FRAME_W * 2) / hParts) * (i + 0.5)
        const tickX = MARGIN + FRAME_W + ((innerW - FRAME_W * 2) / hParts) * (i + 1)
        const labelStyle: React.CSSProperties = {
          position: 'absolute',
          left: xPos,
          transform: 'translateX(-50%) translateY(-50%)',
          color: '#cc0000',
          fontFamily: 'monospace',
          fontSize: 24,
          fontWeight: 'bold'
        }
        return (
          <div key={`h-${i}`}>
            <div style={{ ...labelStyle, top: MARGIN + (FRAME_W / 2) }}>{i + 1}</div>
            <div style={{ ...labelStyle, bottom: MARGIN + (FRAME_W / 2), transform: 'translateX(-50%) translateY(50%)' }}>{i + 1}</div>
            {/* Ticks */}
            {i < hParts - 1 && (
              <>
                <div style={{ position: 'absolute', top: MARGIN, left: tickX, width: 2, height: FRAME_W, backgroundColor: '#cc0000' }} />
                <div style={{ position: 'absolute', bottom: MARGIN, left: tickX, width: 2, height: FRAME_W, backgroundColor: '#cc0000' }} />
              </>
            )}
          </div>
        )
      })}

      {/* Vertical Scale Labels */}
      {Array.from({ length: vParts }).map((_, i) => {
        const yPos = MARGIN + FRAME_W + ((innerH - FRAME_W * 2) / vParts) * (i + 0.5)
        const tickY = MARGIN + FRAME_W + ((innerH - FRAME_W * 2) / vParts) * (i + 1)
        const labelStyle: React.CSSProperties = {
          position: 'absolute',
          top: yPos,
          transform: 'translateY(-50%) translateX(-50%)',
          color: '#cc0000',
          fontFamily: 'monospace',
          fontSize: 24,
          fontWeight: 'bold'
        }
        return (
          <div key={`v-${i}`}>
            <div style={{ ...labelStyle, left: MARGIN + (FRAME_W / 2) }}>{String.fromCharCode(65 + i)}</div>
            <div style={{ ...labelStyle, right: MARGIN + (FRAME_W / 2), transform: 'translateY(-50%) translateX(50%)' }}>{String.fromCharCode(65 + i)}</div>
            {/* Ticks */}
            {i < vParts - 1 && (
              <>
                <div style={{ position: 'absolute', left: MARGIN, top: tickY, height: 2, width: FRAME_W, backgroundColor: '#cc0000' }} />
                <div style={{ position: 'absolute', right: MARGIN, top: tickY, height: 2, width: FRAME_W, backgroundColor: '#cc0000' }} />
              </>
            )}
          </div>
        )
      })}

      {/* Title Block - Adjusted to sit inside the inner frame */}
      <div 
        style={{
          position: 'absolute',
          bottom: MARGIN + FRAME_W,
          right: MARGIN + FRAME_W,
          width: 450,
          height: 220,
          borderTop: '2px solid #cc0000',
          borderLeft: '2px solid #cc0000',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'transparent'
        }}
      >
        <div style={{ flex: 1.5, borderBottom: '1px solid #cc0000', padding: '12px 16px', color: '#cc0000', fontFamily: 'monospace', fontSize: 22, display: 'flex', alignItems: 'center' }}>
          <strong>TITLE:</strong>&nbsp;AI SCHEMATIC ASSISTANT
        </div>
        <div style={{ display: 'flex', flex: 1, borderBottom: '1px solid #cc0000' }}>
          <div style={{ flex: 1, borderRight: '1px solid #cc0000', padding: 8, color: '#cc0000', fontFamily: 'monospace', fontSize: 16, display: 'flex', alignItems: 'center' }}>
            <strong>SIZE:</strong>&nbsp;{presetName}
          </div>
          <div style={{ flex: 1, padding: 8, color: '#cc0000', fontFamily: 'monospace', fontSize: 16, display: 'flex', alignItems: 'center' }}>
            <strong>SCALE:</strong>&nbsp;1:1
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 16px', color: '#cc0000', fontFamily: 'monospace', fontSize: 18, display: 'flex', alignItems: 'center' }}>
          <strong>REV:</strong>&nbsp;v1.0.42
        </div>
      </div>
    </div>
  )
}

function EditorUI({ schematicId }: { schematicId: Id<"schematics"> }) {
  const editor = useEditor()

  const connectPins = useSchematicStore((s) => s.connectPins)
  const syncRecords = useMutation(api.schematics.sync)
  
  const schematic = useQuery(api.schematics.getById, { id: schematicId })

  // isHydrated: true once the initial DB load is complete
  const isHydrated = useRef(false)
  // Track IDs and timestamps of things the LOCAL user has touched
  const localEdits = useRef<Record<string, number>>({})

  // Logic hooks
  useNetlistSync(editor, connectPins)
  const { handleAddComponent } = useLibraryActions(editor)
  const { 
    nearestPin, 
    nearestPinRef, 
    setPendingStartPin, 
    pendingRef 
  } = useSchematicInteraction(editor)

  useERC()
  useSymbolSync(editor)

  // ── ENABLE GRID ──
  useEffect(() => {
    editor.updateInstanceState({ isGridMode: true })
  }, [editor])

  // ── UPLOAD: push local user changes to Convex ──
  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      if (!isHydrated.current) return

      const updates: TLRecord[] = []
      const deletions: TLShapeId[] = []

      Object.values(changes.added).forEach((record) => {
        if (record.typeName === 'shape' || record.typeName === 'binding') {
          updates.push(record)
          localEdits.current[record.id] = Date.now()
        }
      })
      Object.values(changes.updated).forEach(([, next]) => {
        if (next.typeName === 'shape' || next.typeName === 'binding') {
          updates.push(next)
          localEdits.current[next.id] = Date.now()
        }
      })
      Object.values(changes.removed).forEach((record) => {
        if (record.typeName === 'shape' || record.typeName === 'binding') {
          deletions.push(record.id as TLShapeId)
          localEdits.current[record.id] = Date.now()
        }
      })

      if (updates.length > 0 || deletions.length > 0) {
        syncRecords({ schematicId, updates, deletions })
          .catch(err => console.error("Sync failed:", err))
      }
    }, { source: 'user', scope: 'document' })

    return () => cleanup()
  }, [editor, schematicId, syncRecords])

  // ── DOWNLOAD: receive changes from Convex ──
  const records = useQuery(api.schematics.getRecords, { schematicId })
  
  // ── CAMERA PERSISTENCE: Download ──
  const cameraRestored = useRef(false)
  useEffect(() => {
    if (!schematic || cameraRestored.current) return
    if (schematic.cameraX !== undefined && schematic.cameraY !== undefined && schematic.cameraZoom !== undefined) {
      editor.setCamera({ x: schematic.cameraX, y: schematic.cameraY, z: schematic.cameraZoom })
    }
    cameraRestored.current = true
  }, [editor, schematic])

  // ── CAMERA PERSISTENCE: Upload (Debounced) ──
  const updateCamera = useMutation(api.schematics.updateCamera)
  const pushCamera = useMemo(() => debounce(async (cam: { x: number, y: number, z: number }) => {
    try {
      await updateCamera({ id: schematicId, x: cam.x, y: cam.y, zoom: cam.z })
    } catch (err) {
      console.error("Failed to sync camera", err)
    }
  }, 1000), [updateCamera, schematicId])

  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      // Camera state is usually in 'camera' or 'instance' records (session scope)
      const hasCameraChanges = 
        Object.values(changes.updated).some(([, next]) => 
          next.typeName === 'camera' || next.typeName === 'instance'
        )
      
      if (hasCameraChanges) {
        const cam = editor.getCamera()
        pushCamera(cam)
      }
    }) // Removed { source: 'user', scope: 'document' } to capture all scopes

    return () => {
      cleanup()
      pushCamera.cancel()
    }
  }, [editor, pushCamera])

  useEffect(() => {
    if (!records) return

    const mapShape = (s: any): TLShape | null => {
      if (s.type === 'line') return null
      return {
        id: s.tldrawId as TLShapeId,
        typeName: 'shape',
        type: s.type,
        x: s.x,
        y: s.y,
        rotation: s.rotation,
        index: s.index as any,
        parentId: s.parentId as TLParentId,
        isLocked: s.isLocked,
        opacity: s.opacity,
        props: {
          color: "black",
          dash: "draw",
          size: "m",
          fill: "none",
          font: "draw",
          align: "middle",
          spline: "line",
          ...(s.props || {})
        },
        meta: s.meta,
      } as TLShape
    }

    const mapBinding = (b: any) => ({
      id: b.tldrawId as any,
      typeName: 'binding' as const,
      type: b.type,
      fromId: b.fromId,
      toId: b.toId,
      props: b.props,
      meta: b.meta,
    })

    if (!isHydrated.current) {
      // ── Initial load: put everything from DB into the editor ──
      const batch: TLRecord[] = []
      records.shapes.forEach(s => { const r = mapShape(s); if (r) batch.push(r) })
      records.bindings.forEach(b => batch.push(mapBinding(b) as any)) 
      if (batch.length > 0) editor.store.put(batch)
      isHydrated.current = true
      return
    }

    // ── Live sync ──
    const now = Date.now()
    const OWNERSHIP_TTL = 10_000 
    const newRecords: TLRecord[] = []
    
    records.shapes.forEach(s => {
      const r = mapShape(s)
      if (!r) return
      const isNew = !editor.store.has(r.id)
      const userOwns = (localEdits.current[s.tldrawId] ?? 0) > now - OWNERSHIP_TTL
      if (isNew && !userOwns) newRecords.push(r)
    })

    records.bindings.forEach(b => {
      const r = mapBinding(b)
      if (!editor.store.has(r.id)) newRecords.push(r)
    })
    
    if (newRecords.length > 0) {
      editor.store.mergeRemoteChanges(() => editor.store.put(newRecords))
    }
  }, [editor, records])

  return (
    <>
      <SheetSettings 
        schematicId={schematicId}
        currentPreset={schematic?.sheetPreset}
        currentWidth={schematic?.sheetWidth}
        currentHeight={schematic?.sheetHeight}
      />
      <ProximityHotspot 
        editor={editor}
        nearestPin={nearestPin}
        nearestPinRef={nearestPinRef}
        setPendingStartPin={setPendingStartPin}
        pendingRef={pendingRef}
      />
      <LibrarySidebar onAddComponent={handleAddComponent} />
      <ErcReportPanel />
    </>
  )
}

export default function SchematicEditor({ schematicId }: { schematicId: Id<"schematics"> }) {
  const schematic = useQuery(api.schematics.getById, { id: schematicId })

  if (schematic === undefined) return <div className="fixed inset-0 flex items-center justify-center bg-white font-medium text-slate-400">Loading schematic...</div>
  if (schematic === null) return <div className="fixed inset-0 flex items-center justify-center bg-white font-medium text-red-400">Schematic not found</div>

  return (
    <div className="fixed inset-0" style={{ '--color-grid': '#d0d0d0' } as React.CSSProperties}>
      <SchematicContext.Provider value={schematicId}>
        <Tldraw 
          shapeUtils={shapeUtils} 
          className="bg-[#ffffee]" 
          inferDarkMode={false}
          components={{ 
            OnTheCanvas: KiCadSheet,
            Toolbar: null,
            StylePanel: null,
            PageMenu: null,
            MainMenu: null,
            ActionsMenu: null,
            HelpMenu: null,
          }}
        >
          <EditorUI schematicId={schematicId} />
        </Tldraw>
      </SchematicContext.Provider>
    </div>
  )
}
