import { Tldraw, useEditor, track, Editor, TLShapePartial } from 'tldraw'
import 'tldraw/tldraw.css'
import { useQuery, useMutation } from "convex/react"
import { api } from "@workspace/backend/_generated/api"
import { Id } from "@workspace/backend/_generated/dataModel"
import { useEffect, useMemo, useRef } from 'react'

import { FootprintShapeUtil } from './editor/pcb/FootprintShapeUtil'
import { RatsnestShapeUtil } from './editor/pcb/RatsnestShapeUtil'
import { BoardOutlineShapeUtil } from './editor/pcb/BoardOutlineShapeUtil'
import { computeRatsnest } from '../lib/pcb-logic'
import { useSchematicStore } from '../store/useSchematicStore'
import { mmToPx, pxToMm } from '@workspace/core'

const shapeUtils = [FootprintShapeUtil, RatsnestShapeUtil, BoardOutlineShapeUtil]

function PCBEditorUI({ schematicId }: { schematicId: Id<"schematics"> }) {
  const editor = useEditor()
  const netlist = useSchematicStore(s => s.netlist)
  
  const board = useQuery(api.pcb.getBoardBySchematicId, { schematicId })
  const footprints = useQuery(api.pcb.getFootprints, board ? { boardId: board._id } : "skip" as any)
  const updateFootprint = useMutation(api.pcb.updateFootprint)

  // 1. Initialize Board Outline
  useEffect(() => {
    if (!board) return
    const outlineId = 'shape:board-outline' as any
    if (!editor.store.has(outlineId)) {
      editor.createShape({
        id: outlineId,
        type: 'board-outline',
        x: 0,
        y: 0,
        props: {
          w: board.boardWidth,
          h: board.boardHeight,
        },
        isLocked: true,
      })
    }
  }, [editor, board])

  // 2. Sync Footprints from Convex to tldraw
  useEffect(() => {
    if (!footprints) return
    
    const shapesToPut: any[] = footprints.map(f => ({
      id: `shape:footprint-${f._id}` as any,
      type: 'footprint',
      x: mmToPx(f.x),
      y: mmToPx(f.y),
      rotation: (f.rotation * Math.PI) / 180,
      props: {
        componentRef: f.componentRef,
        footprintId: f.footprintId,
        layer: f.layer,
        w: 10,
        h: 10,
        pads: [],
      }
    }))

    editor.run(() => {
      const shapesToCreate: any[] = []
      const shapesToUpdate: any[] = []
      
      shapesToPut.forEach(s => {
        if (editor.store.has(s.id)) {
          shapesToUpdate.push(s)
        } else {
          shapesToCreate.push(s)
        }
      })

      if (shapesToCreate.length) editor.createShapes(shapesToCreate)
      if (shapesToUpdate.length) editor.updateShapes(shapesToUpdate)
    })
  }, [editor, footprints])

  // 3. Compute and Sync Ratsnest
  const ratsnestData = useMemo(() => {
    return computeRatsnest(netlist, footprints || [])
  }, [netlist, footprints])

  useEffect(() => {
    const ratsnestId = 'shape:ratsnest' as any
    const data = {
      id: ratsnestId,
      type: 'ratsnest',
      x: 0,
      y: 0,
      props: {
        lines: ratsnestData
      },
      isLocked: true,
    }

    if (editor.store.has(ratsnestId)) {
      editor.updateShape(data)
    } else {
      editor.createShape(data)
    }
  }, [editor, ratsnestData])

  // 4. Persistence: Push footprint moves back to Convex
  useEffect(() => {
    const cleanup = editor.store.listen(({ changes }) => {
      Object.keys(changes.updated).forEach((id) => {
        const next = editor.getShape(id as any)
        if (next?.type === 'footprint') {
          const dbId = next.id.replace('shape:footprint-', '')
          updateFootprint({
            id: dbId as Id<"pcb_footprints">,
            x: pxToMm(next.x),
            y: pxToMm(next.y),
            rotation: (next.rotation * 180) / Math.PI
          })
        }
      })
    }, { source: 'user', scope: 'document' })

    return () => cleanup()
  }, [editor, updateFootprint])

  return null
}

export default function PCBEditor({ schematicId }: { schematicId: Id<"schematics"> }) {
  return (
    <div className="fixed inset-0 bg-[#121212]">
      <Tldraw 
        shapeUtils={shapeUtils} 
        inferDarkMode={true}
        components={{
          StylePanel: null,
          PageMenu: null,
          MainMenu: null,
          ActionsMenu: null,
          HelpMenu: null,
        }}
      >
        <PCBEditorUI schematicId={schematicId} />
      </Tldraw>
    </div>
  )
}
