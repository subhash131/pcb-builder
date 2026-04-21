import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type EditorTab = 'schematic' | 'pcb' | '3d'

interface EditorState {
  activeTab: EditorTab
  setActiveTab: (tab: EditorTab) => void
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      activeTab: 'schematic',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'pcb-builder-editor-storage',
    }
  )
)
