'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { AlertTriangle, Plus, Trash2, RefreshCw } from 'lucide-react'
import { SyncReport, SyncActionType } from '@workspace/core'
import { cn } from "@workspace/ui/lib/utils"

interface SyncDialogProps {
  report: SyncReport
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isApplying: boolean
}

export function SyncDialog({
  report,
  isOpen,
  onClose,
  onConfirm,
  isApplying
}: SyncDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-slate-950 text-slate-100 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            Import from Schematic
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Reconcile logical changes from the schematic into your physical PCB layout.
          </DialogDescription>
        </DialogHeader>

        {report.destructive && (
          <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-200 py-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-sm font-bold">Destructive Changes</AlertTitle>
            <AlertDescription className="text-xs opacity-90">
              This will remove footprints and their existing traces. This action cannot be undone.
            </AlertDescription>
          </Alert>
        )}

        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar my-4 space-y-2">
          {report.actions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic text-sm">
              Your PCB is already in sync with the schematic.
            </div>
          ) : (
            report.actions.map((action, i) => (
              <div
                key={`${action.componentRef}-${i}`}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-md text-sm border",
                  action.type === SyncActionType.ADD && "bg-green-500/10 border-green-500/20 text-green-400",
                  action.type === SyncActionType.REMOVE && "bg-red-500/10 border-red-500/20 text-red-400",
                  action.type === SyncActionType.UPDATE && "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                )}
              >
                <div className="mt-0.5">
                  {action.type === SyncActionType.ADD && <Plus className="w-4 h-4" />}
                  {action.type === SyncActionType.REMOVE && <Trash2 className="w-4 h-4" />}
                  {action.type === SyncActionType.UPDATE && <RefreshCw className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <span className="font-mono font-bold mr-2">{action.componentRef}</span>
                  <span className="opacity-80 leading-relaxed">{action.detail}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-800 hover:bg-slate-900 text-slate-300"
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            variant={report.destructive ? "destructive" : "default"}
            onClick={onConfirm}
            className={cn(
              !report.destructive && "bg-blue-600 hover:bg-blue-700 text-white"
            )}
            disabled={isApplying || report.actions.length === 0}
          >
            {isApplying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              `Apply ${report.actions.length} Changes`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
