import { Tldraw, useEditor, track } from 'tldraw'
import 'tldraw/tldraw.css'
import { SymbolShapeUtil } from './editor/SymbolShape'
import { WireShapeUtil } from './editor/WireShape'
import { useBoardStore } from '../store/useBoardStore'
import { useNetlistSync } from '../hooks/useNetlistSync'
import { useLibraryActions } from '../hooks/useLibraryActions'
import { useSchematicInteraction } from '../hooks/useSchematicInteraction'
import { LibrarySidebar } from './editor/LibrarySidebar'
import { ProximityHotspot } from './editor/ProximityHotspot'
import { useQuery, useMutation } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { Id } from "@workspace/backend/_generated/dataModel"
import { createContext, useContext, useEffect, useRef } from 'react'
import { SheetSettings } from './editor/SheetSettings'

const SchematicContext = createContext<Id<"schematics"> | null>(null)

const shapeUtils = [SymbolShapeUtil, WireShapeUtil]

export const PAGE_PRESETS = {
  'A5': { width: 2100, height: 1480, name: 'A5' },
  'A4': { width: 2970, height: 2100, name: 'A4' },
  'A3': { width: 4200, height: 2970, name: 'A3' },
  'A2': { width: 5940, height: 4200, name: 'A2' },
  'A1': { width: 8410, height: 5940, name: 'A1' },
  'A0': { width: 11890, height: 8410, name: 'A0' },
  'ANSI A': { width: 2794, height: 2159, name: 'ANSI A' },
  'ANSI B': { width: 4318, height: 2794, name: 'ANSI B' },
  'ANSI C': { width: 5588, height: 4318, name: 'ANSI C' },
  'ANSI D': { width: 8636, height: 5588, name: 'ANSI D' },
  'ANSI E': { width: 11176, height: 8636, name: 'ANSI E' },
  'Custom': { width: 2970, height: 2100, name: 'Custom' },
}

const KiCadSheet = () => {
  const schematicId = useContext(SchematicContext)
  const schematic = useQuery(api.schematics.getById, schematicId ? { id: schematicId } : "skip" as any)

  if (!schematicId) return null

  const width = schematic?.sheetWidth ?? 2970
  const height = schematic?.sheetHeight ?? 2100
  const presetName = schematic?.sheetPreset ?? 'A4'

  const PAGE_W = width
  const PAGE_H = height
  const MARGIN = 100
  const FRAME_W = 40 // Space between the two red lines for labels
  
  // Fixed physical scale: 1 division = 50 mm = 500 canvas units (1 unit = 0.1 mm)
  // This keeps the tick spacing constant regardless of sheet size.
  const DIVISION_SIZE = 500 // canvas units per division (50 mm)
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
        return (
          <div key={`h-${i}`}>
            {/* Top labels */}
            <div style={{ position: 'absolute', top: MARGIN + 4, left: xPos, transform: 'translateX(-50%)', color: '#cc0000', fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold' }}>{i + 1}</div>
            {/* Bottom labels */}
            <div style={{ position: 'absolute', bottom: MARGIN + 4, left: xPos, transform: 'translateX(-50%)', color: '#cc0000', fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold' }}>{i + 1}</div>
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
        return (
          <div key={`v-${i}`}>
            {/* Left labels */}
            <div style={{ position: 'absolute', left: MARGIN + 8, top: yPos, transform: 'translateY(-50%)', color: '#cc0000', fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold' }}>{String.fromCharCode(65 + i)}</div>
            {/* Right labels */}
            <div style={{ position: 'absolute', right: MARGIN + 8, top: yPos, transform: 'translateY(-50%)', color: '#cc0000', fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold' }}>{String.fromCharCode(65 + i)}</div>
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

  const connectPins = useBoardStore((s) => s.connectPins)
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

  // ── ENABLE GRID ──
  useEffect(() => {
    editor.updateInstanceState({ isGridMode: true })
  }, [editor])

  // ── UPLOAD: push local user changes to Convex ──
  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      if (!isHydrated.current) return

      const updates: any[] = []
      const deletions: string[] = []

      Object.values(changes.added).forEach((record) => {
        if (record.id.startsWith('shape') || record.id.startsWith('binding')) {
          updates.push(record)
          localEdits.current[record.id] = Date.now()
        }
      })
      Object.values(changes.updated).forEach(([, next]) => {
        const n = next as any
        if (n.id.startsWith('shape') || n.id.startsWith('binding')) {
          updates.push(n)
          localEdits.current[n.id] = Date.now()
        }
      })
      Object.values(changes.removed).forEach((record) => {
        if (record.id.startsWith('shape') || record.id.startsWith('binding')) {
          deletions.push(record.id)
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
  
  useEffect(() => {
    if (!records) return

    const mapShape = (s: any) => {
      if (s.type === 'line') return null
      return {
        id: s.tldrawId,
        typeName: 'shape' as const,
        type: s.type,
        x: s.x,
        y: s.y,
        rotation: s.rotation,
        index: s.index,
        parentId: s.parentId,
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
      }
    }

    const mapBinding = (b: any) => ({
      id: b.tldrawId,
      typeName: 'binding' as const,
      type: b.type,
      fromId: b.fromId,
      toId: b.toId,
      props: b.props,
      meta: b.meta,
    })

    if (!isHydrated.current) {
      // ── Initial load: put everything from DB into the editor ──
      const batch: any[] = []
      records.shapes.forEach(s => { const r = mapShape(s); if (r) batch.push(r) })
      records.bindings.forEach(b => batch.push(mapBinding(b)))
      if (batch.length > 0) editor.store.put(batch)
      isHydrated.current = true
      return
    }

    // ── Live sync: ONLY inject shapes that are brand-new in the DB ──
    // (i.e. the AI just added them). We NEVER overwrite shapes the local
    // user already has on their canvas — that would cause rubber-banding.
    const now = Date.now()
    const OWNERSHIP_TTL = 10_000 // 10s — user owns a shape for this long after last touch
    const newRecords: any[] = []
    
    records.shapes.forEach(s => {
      const r = mapShape(s)
      if (!r) return
      const isNew = !editor.store.has(r.id as any)
      const userOwns = (localEdits.current[s.tldrawId] ?? 0) > now - OWNERSHIP_TTL
      if (isNew && !userOwns) newRecords.push(r)
    })

    records.bindings.forEach(b => {
      const r = mapBinding(b)
      if (!editor.store.has(r.id as any)) newRecords.push(r)
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
          components={{ OnTheCanvas: KiCadSheet }}
        >
          <EditorUI schematicId={schematicId} />
        </Tldraw>
      </SchematicContext.Provider>
    </div>
  )
}
