import { Netlist } from '../schematic/Netlist';
import { FootprintPlacement } from '../pcb/ForwardAnnotator';

export enum SyncActionType {
  ADD = 'add',      // new in schematic, missing from PCB
  REMOVE = 'remove',   // deleted from schematic, still in PCB
  UPDATE = 'update',   // footprintId or value changed in schematic
  OK = 'ok',       // no change needed
}

export type SyncActionPayload = 
  | { footprintId: string } 
  | { footprint: FootprintPlacement } 
  | { old: string; new: string };

export interface SyncAction {
  type: SyncActionType;
  componentRef: string;
  detail: string;          
  payload: SyncActionPayload;
}

export interface SyncReport {
  actions: SyncAction[];
  hasChanges: boolean;
  destructive: boolean;    // true if any REMOVE actions exist
}

export class SchematicPCBSync {
  /**
   * Computes the differences between the logical symbols in the netlist
   * and the physical footprint placements already on the PCB.
   */
  static diff(netlist: Netlist, footprints: FootprintPlacement[]): SyncReport {
    // Schematic symbols are the source of truth for "what should exist"
    const schematicRefs = new Map(
      netlist.getComponents().map(c => [c.ref, c])
    );
    
    // PCB footprints are what "currently exists"
    const pcbRefs = new Map(
      footprints.map(f => [f.componentRef, f])
    );

    const actions: SyncAction[] = [];

    // 1. Components in schematic but not PCB → ADD
    for (const [ref, component] of schematicRefs) {
      if (!pcbRefs.has(ref)) {
        actions.push({
          type: SyncActionType.ADD,
          componentRef: ref,
          detail: `Add ${ref} (${component.footprintId || 'no footprint'}) to PCB`,
          payload: { footprintId: component.footprintId },
        });
      }
    }

    // 2. Components in PCB but not schematic → REMOVE
    for (const [ref, footprint] of pcbRefs) {
      if (!schematicRefs.has(ref)) {
        actions.push({
          type: SyncActionType.REMOVE,
          componentRef: ref,
          detail: `Remove ${ref} from PCB — deleted from schematic`,
          payload: { footprint },
        });
      }
    }

    // 3. Components in both → check for updates (e.g. footprintId change)
    for (const [ref, component] of schematicRefs) {
      const pcbFp = pcbRefs.get(ref);
      if (!pcbFp) continue;

      // If the footprint ID has changed in schematic, we need an UPDATE
      if (component.footprintId && pcbFp.footprintId !== component.footprintId) {
        actions.push({
          type: SyncActionType.UPDATE,
          componentRef: ref,
          detail: `${ref}: footprint changed ${pcbFp.footprintId} → ${component.footprintId}`,
          payload: { old: pcbFp.footprintId, new: component.footprintId },
        });
      }
    }

    return {
      actions,
      hasChanges: actions.length > 0,
      destructive: actions.some(a => a.type === SyncActionType.REMOVE),
    };
  }
}
