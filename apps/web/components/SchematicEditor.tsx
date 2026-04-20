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
  
  // Track if we are currently performing initial load
  const isHydrated = useRef(false)

  // Logic hooks
  useNetlistSync(editor, connectPins)
  const { handleAddComponent } = useLibraryActions(editor)
  const { 
    nearestPin, 
    nearestPinRef, 
    setPendingStartPin, 
    pendingRef 
  } = useSchematicInteraction(editor)

  // Incremental Sync Logic
  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      // Don't sync if it's not a user change or if we haven't finished hydration
      if (!isHydrated.current) return

      const updates: any[] = []
      const deletions: string[] = []

      // Added or Updated
      Object.values(changes.added).forEach((record) => {
        if (record.id.startsWith('shape') || record.id.startsWith('binding')) {
          updates.push(record)
        }
      })
      Object.values(changes.updated).forEach(([prev, next]) => {
        if (next.id.startsWith('shape') || next.id.startsWith('binding')) {
          updates.push(next)
        }
      })
      // Removed
      Object.values(changes.removed).forEach((record) => {
        if (record.id.startsWith('shape') || record.id.startsWith('binding')) {
          deletions.push(record.id)
        }
      })

      if (updates.length > 0 || deletions.length > 0) {
        syncRecords({
          schematicId,
          updates,
          deletions
        }).catch(err => console.error("Sync failed:", err))
      }
    }, { source: 'user', scope: 'document' })

    return () => cleanup()
  }, [editor, schematicId, syncRecords])

  // Hydration logic
  const records = useQuery(api.schematics.getRecords, { schematicId })
  
  useEffect(() => {
    if (records && !isHydrated.current) {
      const tldrawRecords: any[] = []
      
      // Map shapes
      records.shapes.forEach(s => {
        tldrawRecords.push({
          id: s.tldrawId,
          typeName: 'shape',
          type: s.type,
          x: s.x,
          y: s.y,
          rotation: s.rotation,
          index: s.index,
          parentId: s.parentId,
          isLocked: s.isLocked,
          opacity: s.opacity,
          props: s.props,
          meta: s.meta,
        })
      })

      // Map bindings
      records.bindings.forEach(b => {
        tldrawRecords.push({
          id: b.tldrawId,
          typeName: 'binding',
          type: b.type,
          fromId: b.fromId,
          toId: b.toId,
          props: b.props,
          meta: b.meta,
        })
      })

      if (tldrawRecords.length > 0) {
        editor.store.put(tldrawRecords)
      }
      
      isHydrated.current = true
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
