import { useValue, Editor } from 'tldraw'

export function CameraTracker({ editor }: { editor: any }) {
  useValue('camera', () => editor.camera, [editor])
  return null
}
