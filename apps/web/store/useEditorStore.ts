import { create } from 'zustand'

type EditorTab = 'schematic' | 'pcb' | '3d'

interface EditorState {
  activeTab: EditorTab
  setActiveTab: (tab: EditorTab) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTab: 'schematic',
  setActiveTab: (tab) => set({ activeTab: tab }),
}))
