import { useValue, Editor } from 'tldraw'

export function CameraTracker({ editor }: { editor: Editor }) {
  useValue('camera', () => editor.getCamera(), [editor])
  return null
}
