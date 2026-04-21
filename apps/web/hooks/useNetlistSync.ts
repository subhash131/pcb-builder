import { useEffect } from 'react'
import { Editor, TLRecord } from 'tldraw'
import { useSchematicStore } from '../store/useSchematicStore'
import { NetlistReconstructor } from '@workspace/core'

/**
 * useNetlistSync
 * 
 * Holistic sync: Rebuilds the entire logical netlist from the current
 * tldraw canvas state whenever a relevant change (add/update/remove/move) occurs.
 * This fixes bugs where disconnections or deletions didn't trigger ERC updates.
 */
export function useNetlistSync(editor: Editor) {
  const setNetlist = useSchematicStore((s) => s.setNetlist)

  useEffect(() => {
    const syncNetlist = () => {
      // 1. Get raw shape data from tldraw store
      const shapes = editor.getCurrentPageShapes()
      
      // 2. Rebuild the netlist from scratch (Self-Healing)
      const newNetlist = NetlistReconstructor.reconstruct(shapes)
      
      // 3. Update the global store (which triggers ERC via useERC)
      setNetlist(newNetlist)
    }

    // Initial sync
    syncNetlist()

    // Listen for any shape changes (added, removed, or props updated)
    const cleanup = editor.store.listen(({ changes }) => {
      const isRelevant = (record: TLRecord) => 
        record.typeName === 'shape' && (record.type === 'symbol' || record.type === 'wire')

      const hasChanges = 
        Object.values(changes.added).some(isRelevant) ||
        Object.values(changes.removed).some(isRelevant) ||
        Object.values(changes.updated).some(([, next]) => isRelevant(next))

      if (hasChanges) {
        syncNetlist()
      }
    }, { scope: 'document' })

    return () => cleanup()
  }, [editor, setNetlist])
}
