import { Tldraw, useEditor, Editor } from 'tldraw'
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
import { useEffect, useRef } from 'react'

const shapeUtils = [SymbolShapeUtil, WireShapeUtil]

function EditorUI({ schematicId }: { schematicId: Id<"schematics"> }) {
  const editor = useEditor()
  const connectPins = useBoardStore((s) => s.connectPins)
  const syncRecords = useMutation(api.schematics.sync)
  
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
    <div className="fixed inset-0">
      <Tldraw 
        shapeUtils={shapeUtils} 
        className="bg-white" 
        inferDarkMode={false}
      >
        <EditorUI schematicId={schematicId} />
      </Tldraw>
    </div>
  )
}
