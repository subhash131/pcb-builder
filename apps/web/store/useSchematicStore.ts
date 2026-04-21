import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Netlist, ErcReport } from '@workspace/core'

interface SchematicState {
  netlist: Netlist
  ercReport: ErcReport | null
  setErcReport: (report: ErcReport) => void
  addComponent: (ref: string, symbolId: string, footprintId: string, pins: { number: string; name: string; type: any }[]) => void
  connectPins: (compA: string, pinA: string, compB: string, pinB: string, netId: string) => void
  getNetlist: () => Netlist
}

export const useSchematicStore = create<SchematicState>()(
  immer((set, get) => ({
    netlist: new Netlist(),
    ercReport: null,
    setErcReport: (report) =>
      set((state) => {
        state.ercReport = report
      }),
    addComponent: (ref, symbolId, footprintId, pins) =>
      set((state) => {
        state.netlist.addComponent(ref, symbolId, footprintId)
        pins.forEach(p => state.netlist.addPin(ref, p.number, p.name, p.type))
      }),
    connectPins: (compA, pinA, compB, pinB, netId) =>
      set((state) => {
        const pinARef = pinA.startsWith('pin-') ? pinA : `pin-${pinA}`
        const pinBRef = pinB.startsWith('pin-') ? pinB : `pin-${pinB}`
        state.netlist.assignNet(`${compA}.${pinARef}`, netId)
        state.netlist.assignNet(`${compB}.${pinBRef}`, netId)
      }),
    getNetlist: () => get().netlist,
  }))
)
