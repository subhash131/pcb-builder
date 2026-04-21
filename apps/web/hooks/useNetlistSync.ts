import { useEffect } from 'react'
import { Editor, TLShape, TLShapeId } from 'tldraw'
import { WireShape } from '../components/editor/WireShape'
import { SymbolShape } from '../components/editor/SymbolShape'

export function useNetlistSync(
  editor: Editor,
  connectPins: (compA: string, pinA: string, compB: string, pinB: string, netId: string) => void
) {
  useEffect(() => {
    // @ts-ignore
    const cleanup = editor.sideEffects?.registerAfterChangeHandler?.('shape', (prev: TLShape, next: TLShape, _source: string) => {
      // Allow syncing from AI API drops as well by relaxing source constraints
      if (!next || next.type !== 'wire') return
      
      const wire = next as WireShape
      const props = wire.props
      if (!props.startBinding || !props.endBinding) return

      const compA = editor.getShape(props.startBinding.shapeId as TLShapeId) as SymbolShape | undefined
      const compB = editor.getShape(props.endBinding.shapeId as TLShapeId) as SymbolShape | undefined
      
      if (compA?.type === 'symbol' && compB?.type === 'symbol') {
        const pinA = props.startBinding.pinId
        const pinB = props.endBinding.pinId
        
        // Ensure netlist is triggered safely
        if (pinA && pinB) {
          connectPins(compA.id, pinA, compB.id, pinB, `NET_${Date.now()}`)
        }
      }
    })
    return () => cleanup?.()
  }, [editor, connectPins])
}
