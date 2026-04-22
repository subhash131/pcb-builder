'use client'

import { useState, useEffect, useMemo } from 'react'
import { Id } from '@workspace/backend/_generated/dataModel'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@workspace/backend/_generated/api'
import dynamic from 'next/dynamic'
import { Layout, Cpu, Box, Share2, Settings } from 'lucide-react'

import { useEditorStore } from '../../store/useEditorStore'
import { ChatPanel } from './ChatPanel'
import { SyncDialog } from './SyncDialog'
import { SchematicPCBSync, NetlistReconstructor } from '@workspace/core'
import { Badge } from '@workspace/ui/components/badge'
import { Button } from '@workspace/ui/components/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

const SchematicEditor = dynamic(() => import('../SchematicEditor'), { ssr: false })
const PCBEditor = dynamic(() => import('../PCBEditor'), { ssr: false })
const PCBViewer3D = dynamic(() => import('../PCBViewer3D'), { ssr: false })

export function EditorShell({ schematicId }: { schematicId: Id<"schematics"> }) {
  const [mounted, setMounted] = useState(false)
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  
  const activeTab = useEditorStore(s => s.activeTab)
  const setActiveTab = useEditorStore(s => s.setActiveTab)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch PCB board and footprints
  const board = useQuery(api.pcb.getBoardBySchematicId, { schematicId })
  const footprints = useQuery(api.pcb.getFootprints, board ? { boardId: board._id } : "skip")
  const applySyncActions = useMutation(api.pcb.applySyncActions)

  // Reconstruct netlist from source-of-truth records
  const schematicRecords = useQuery(api.schematics.getRecords, { schematicId })
  const netlist = useMemo(() => {
    if (!schematicRecords) return null
    return NetlistReconstructor.reconstruct(schematicRecords.shapes)
  }, [schematicRecords])

  // Compute sync report
  const syncReport = netlist && footprints 
    ? SchematicPCBSync.diff(netlist, footprints)
    : { actions: [], hasChanges: false, destructive: false }

  const handleApplySync = async () => {
    if (!board || !syncReport.hasChanges) return
    
    setIsApplying(true)
    try {
      await applySyncActions({
        boardId: board._id,
        actions: syncReport.actions
      })
      toast.success('PCB successfully updated from schematic')
      setIsSyncDialogOpen(false)
    } catch (error) {
      console.error('Sync failed:', error)
      toast.error('Failed to update PCB')
    } finally {
      setIsApplying(false)
    }
  }
  
  // const syncPCB = useMutation(api.pcb.syncFromSchematic)
  
  const handleTabChange = (tab: 'schematic' | 'pcb' | '3d') => {
    setActiveTab(tab)
  }

  if (!mounted) return <div className="flex h-screen w-screen bg-slate-950 items-center justify-center text-slate-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Layout...</div>

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 text-slate-200">
      {/* Top Navigation Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">P</div>
            <span className="font-bold tracking-tight">PCB-BUILDER</span>
          </div>
          
          <nav className="flex items-center bg-slate-900 rounded-lg p-1">
            <button 
              onClick={() => handleTabChange('schematic')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === 'schematic' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Layout className="w-4 h-4" />
              Schematic
            </button>
            <button
              onClick={() => handleTabChange('pcb')}
              className={`px-4 h-full flex items-center gap-2 text-sm font-medium transition-colors border-b-2 relative ${
                activeTab === 'pcb' 
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Cpu className="w-4 h-4" />
              PCB Layout
            </button>
            <button 
              onClick={() => handleTabChange('3d')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition ${activeTab === '3d' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Box className="w-4 h-4" />
              3D View
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'pcb' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-2 bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
              onClick={() => setIsSyncDialogOpen(true)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Import from Schematic
            </Button>
          )}
          <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-md transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Sync Dialog */}
        <SyncDialog 
          isOpen={isSyncDialogOpen}
          onClose={() => setIsSyncDialogOpen(false)}
          report={syncReport}
          onConfirm={handleApplySync}
          isApplying={isApplying}
        />
        {activeTab === 'schematic' && (
          <div className="absolute inset-0">
            <SchematicEditor schematicId={schematicId} />
          </div>
        )}
        {activeTab === 'pcb' && (
          <div className="absolute inset-0">
            <PCBEditor schematicId={schematicId} />
          </div>
        )}
        {activeTab === '3d' && (
          <div className="absolute inset-0">
            <PCBViewer3D schematicId={schematicId} />
          </div>
        )}
        
        {/* Persistent Chat Panel */}
        <ChatPanel schematicId={schematicId} />
      </div>
    </div>
  )
}
