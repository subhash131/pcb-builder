import { useEffect } from 'react'
import { Editor, TLShape } from 'tldraw'

export function useNetlistSync(
  editor: Editor,
  connectPins: (compA: string, pinA: string, compB: string, pinB: string, netId: string) => void
) {
  useEffect(() => {
    // @ts-ignore
    const cleanup = editor.sideEffects?.registerAfterChangeHandler?.('binding', (prev: any, next: any, source: any) => {
      if (source !== 'user' || !next) return
      const binding = next
      const wire = editor.getShape(binding.fromId)
      const component = editor.getShape(binding.toId)
      
      if ((wire?.type === 'arrow' || wire?.type === 'wire') && component?.type === 'symbol') {
        const allBindings = editor.getBindingsFromShape(wire, 'arrow')
        if (allBindings.length === 2) {
          const [b1, b2] = allBindings
          if (!b1 || !b2) return
          const compA = editor.getShape(b1.toId) as TLShape & { props: any }
          const compB = editor.getShape(b2.toId) as TLShape & { props: any }
          if (compA && compB) {
            const resolvePinId = (comp: any, b: any) => {
              const { x, y } = b.props.normalizedAnchor || { x: 0.5, y: 0.5 }
              let nearestId = comp.props.pins[0].id
              let minDist = Infinity
              comp.props.pins.forEach((p: any) => {
                const dist = Math.sqrt((x - p.x)**2 + (y - p.y)**2)
                if (dist < minDist) { minDist = dist; nearestId = p.id; }
              })
              return nearestId
            }
            const pinA = resolvePinId(compA, b1)
            const pinB = resolvePinId(compB, b2)
            connectPins(compA.id, pinA, compB.id, pinB, `NET_${Date.now()}`)
          }
        }
      }
    })
    return () => cleanup?.()
  }, [editor, connectPins])
}
