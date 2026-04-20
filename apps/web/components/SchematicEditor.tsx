import { Tldraw, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import { SymbolShapeUtil } from './editor/SymbolShape'
import { WireShapeUtil } from './editor/WireShape'
import { useBoardStore } from '../store/useBoardStore'
import { useNetlistSync } from '../hooks/useNetlistSync'
import { useLibraryActions } from '../hooks/useLibraryActions'
import { useSchematicInteraction } from '../hooks/useSchematicInteraction'
import { LibrarySidebar } from './editor/LibrarySidebar'
import { ProximityHotspot } from './editor/ProximityHotspot'

const shapeUtils = [SymbolShapeUtil, WireShapeUtil]

function EditorUI() {
  const editor = useEditor()
  const connectPins = useBoardStore((s) => s.connectPins)

  // Logic hooks
  useNetlistSync(editor, connectPins)
  const { handleAddComponent } = useLibraryActions(editor)
  const { 
    nearestPin, 
    nearestPinRef, 
    setPendingStartPin, 
    pendingRef 
  } = useSchematicInteraction(editor)

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

export default function SchematicEditor() {
  return (
    <div className="fixed inset-0">
      <Tldraw 
        persistenceKey="pcb-builder-schematic" 
        shapeUtils={shapeUtils} 
        className="bg-white" 
        inferDarkMode={false}
      >
        <EditorUI />
      </Tldraw>
    </div>
  )
}
