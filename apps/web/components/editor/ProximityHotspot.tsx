import { Editor } from 'tldraw'
import { CameraTracker } from './CameraTracker'

interface ProximityHotspotProps {
  editor: Editor
  nearestPin: { x: number, y: number, shapeId: string, pinId: string } | null
  nearestPinRef: React.MutableRefObject<any>
  setPendingStartPin: (pending: any) => void
  pendingRef: React.MutableRefObject<any>
}

export function ProximityHotspot({ 
  editor, 
  nearestPin, 
  nearestPinRef, 
  setPendingStartPin,
  pendingRef
}: ProximityHotspotProps) {
  if (!nearestPin) return null

  return (
    <div 
      onPointerDown={(e) => {
        e.stopPropagation()
        const { x, y } = editor.inputs.currentPagePoint
        const currentNearest = nearestPinRef.current
        if (currentNearest) {
          const pending = { ...currentNearest, startPoint: { x, y } }
          setPendingStartPin(pending)
          pendingRef.current = pending
        }
      }}
      className="absolute z-2000 cursor-crosshair pointer-events-auto group"
      style={{ 
        left: editor.pageToScreen(nearestPin).x, 
        top: editor.pageToScreen(nearestPin).y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <CameraTracker editor={editor} />
      <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-400/30 animate-pulse group-hover:scale-125 transition-transform" />
    </div>
  )
}
