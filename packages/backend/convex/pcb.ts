import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server.js";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel.js";

// Note: In a real production app, we'd import { FootprintResolver } from "@workspace/core"
// but to ensure zero-config reliability in the Convex sandbox, I'll implement the logic locally.

interface NetlistNode {
  attributes: {
    kind: string;
    ref: string;
    symbolId?: string;
    footprintId?: string;
  };
}

function resolveFootprint(component: NetlistNode['attributes']): string {
  if (component.footprintId && component.footprintId !== "unknown" && component.footprintId !== "") {
    return component.footprintId;
  }
  
  const ref = component.ref || "";
  const symbolId = (component.symbolId || "").toLowerCase();

  // Smart defaults
  if (ref.startsWith('R') || symbolId.includes('resistor')) return 'Resistor_SMD:R_0805_2012Metric';
  if (ref.startsWith('C') || symbolId.includes('capacitor')) return 'Capacitor_SMD:C_0805_2012Metric';
  if (ref.startsWith('L') || symbolId.includes('inductor')) return 'Inductor_SMD:L_0805_2012Metric';
  if (ref.startsWith('D') || symbolId.includes('led')) return 'LED_SMD:LED_0805_2012Metric';
  
  return 'Generic:HOUSING_DIP_8_W7.62mm';
}

/**
 * Ensures a PCB board exists for the given schematic.
 */
export const getOrCreateBoard = mutation({
  args: { schematicId: v.id("schematics") },
  handler: async (ctx: MutationCtx, args: { schematicId: Id<"schematics"> }) => {
    const existing = await ctx.db
      .query("pcb_boards")
      .withIndex("by_schematicId", (q: any) => q.eq("schematicId", args.schematicId))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("pcb_boards", {
      schematicId: args.schematicId,
      boardWidth: 100, // default 100mm
      boardHeight: 80,
      layers: 2,
      gridConfig: {
        unit: "mm",
        size: 0.1,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Fetches the PCB board for a schematic.
 */
export const getBoardBySchematicId = query({
  args: { schematicId: v.id("schematics") },
  handler: async (ctx: QueryCtx, args: { schematicId: Id<"schematics"> }) => {
    return await ctx.db
      .query("pcb_boards")
      .withIndex("by_schematicId", (q: any) => q.eq("schematicId", args.schematicId))
      .unique();
  },
});

/**
 * Fetches all footprints for a board.
 */
export const getFootprints = query({
  args: { boardId: v.id("pcb_boards") },
  handler: async (ctx: QueryCtx, args: { boardId: Id<"pcb_boards"> }) => {
    return await ctx.db
      .query("pcb_footprints")
      .withIndex("by_board", (q: any) => q.eq("boardId", args.boardId))
      .collect();
  },
});

/**
 * Diff-based sync from schematic netlist.
 */
export const syncFromSchematic = mutation({
  args: { 
    schematicId: v.id("schematics"),
    netlist: v.any() // The graphology export
  },
  handler: async (ctx: MutationCtx, args: { schematicId: Id<"schematics">; netlist: any }) => {
    const { schematicId, netlist } = args;
    
    // 1. Get or create board
    let board = await ctx.db
      .query("pcb_boards")
      .withIndex("by_schematicId", (q: any) => q.eq("schematicId", schematicId))
      .unique();
    
    if (!board) {
      const boardId = await ctx.db.insert("pcb_boards", {
        schematicId,
        boardWidth: 100,
        boardHeight: 80,
        layers: 2,
        gridConfig: { unit: "mm", size: 0.1 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      board = await ctx.db.get(boardId);
    }
    if (!board) throw new Error("Could not find or create board");

    // 2. Get existing footprints
    const existingFootprints = await ctx.db
      .query("pcb_footprints")
      .withIndex("by_board", q => q.eq("boardId", board._id))
      .collect();

    const existingRefs = new Set(existingFootprints.map((f: any) => f.componentRef));
    
    const incomingComponents = ((netlist as any).nodes || [])
      .filter((n: NetlistNode) => n.attributes?.kind === 'component')
      .map((n: NetlistNode) => n.attributes);
    
    const incomingRefs = new Set(incomingComponents.map((c: NetlistNode['attributes']) => c.ref));

    // ADD new components
    for (const component of incomingComponents) {
      if (!existingRefs.has(component.ref)) {
        await ctx.db.insert("pcb_footprints", {
          boardId: board._id,
          componentRef: component.ref,
          footprintId: resolveFootprint(component),
          x: 0, 
          y: 0,
          rotation: 0,
          layer: "F.Cu",
          isLocked: false,
        });
      } else {
        // Update footprintId if it changed (e.g. user changed property in schematic)
        const existing = existingFootprints.find((f: any) => f.componentRef === component.ref);
        const newFootprintId = resolveFootprint(component);
        if (existing && existing.footprintId !== newFootprintId) {
          await ctx.db.patch(existing._id, { footprintId: newFootprintId });
        }
      }
    }

    // REMOVE deleted components
    for (const existing of existingFootprints) {
      if (!incomingRefs.has(existing.componentRef)) {
        await ctx.db.delete(existing._id);
      }
    }

    // Update board timestamp
    await ctx.db.patch(board._id, { updatedAt: Date.now() });
    
    return board._id;
  },
});

/**
 * Updates a single footprint's placement.
 */
export const updateFootprint = mutation({
  args: {
    id: v.id("pcb_footprints"),
    x: v.number(),
    y: v.number(),
    rotation: v.optional(v.number()),
    layer: v.optional(v.union(v.literal("F.Cu"), v.literal("B.Cu"))),
  },
  handler: async (ctx: MutationCtx, args: { id: Id<"pcb_footprints">; x: number; y: number; rotation?: number; layer?: "F.Cu" | "B.Cu" }) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

/**
 * Updates multiple footprints' placements in a single batch.
 */
export const updateFootprints = mutation({
  args: {
    updates: v.array(v.object({
      id: v.id("pcb_footprints"),
      x: v.number(),
      y: v.number(),
      rotation: v.optional(v.number()),
      layer: v.optional(v.union(v.literal("F.Cu"), v.literal("B.Cu"))),
    }))
  },
  handler: async (ctx: MutationCtx, args: { updates: Array<{ id: Id<"pcb_footprints">; x: number; y: number; rotation?: number; layer?: "F.Cu" | "B.Cu" }> }) => {
    for (const update of args.updates) {
      const { id, ...fields } = update;
      await ctx.db.patch(id, fields);
    }
  },
});

/**
 * Updates board dimensions and preset.
 */
export const updateBoard = mutation({
  args: {
    id: v.id("pcb_boards"),
    width: v.number(),
    height: v.number(),
    preset: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { id: Id<"pcb_boards">; width: number; height: number; preset: string }) => {
    await ctx.db.patch(args.id, {
      boardWidth: args.width,
      boardHeight: args.height,
      boardPreset: args.preset,
      updatedAt: Date.now(),
    });
  },
});
/**
 * Updates the camera state for a PCB board.
 */
export const updateCamera = mutation({
  args: {
    id: v.id("pcb_boards"),
    x: v.number(),
    y: v.number(),
    zoom: v.number(),
  },
  handler: async (ctx: MutationCtx, args: { id: Id<"pcb_boards">; x: number; y: number; zoom: number }) => {
    return await ctx.db.patch(args.id, {
      cameraX: args.x,
      cameraY: args.y,
      cameraZoom: args.zoom,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Applies a batch of sync actions (ADD, REMOVE, UPDATE) from schematic diff.
 */
export const applySyncActions = mutation({
  args: {
    boardId: v.id("pcb_boards"),
    actions: v.array(v.object({
      type: v.string(), // 'add' | 'remove' | 'update'
      componentRef: v.string(),
      detail: v.string(),
      payload: v.any(),
    })),
  },
  handler: async (ctx: MutationCtx, args: { boardId: Id<"pcb_boards">; actions: any[] }) => {
    const { boardId, actions } = args;

    for (const action of actions) {
      const existing = await ctx.db
        .query("pcb_footprints")
        .withIndex("by_ref", (q: any) => q.eq("boardId", boardId).eq("componentRef", action.componentRef))
        .unique();

      switch (action.type) {
        case 'add':
          if (!existing) {
            await ctx.db.insert("pcb_footprints", {
              boardId,
              componentRef: action.componentRef,
              footprintId: action.payload.footprintId || "Resistor_SMD:R_0805_2012Metric",
              x: 0,
              y: 0,
              rotation: 0,
              layer: "F.Cu",
              isLocked: false,
            });
          }
          break;
        case 'remove':
          if (existing) {
            await ctx.db.delete(existing._id);
          }
          break;
        case 'update':
          if (existing) {
            await ctx.db.patch(existing._id, {
              footprintId: action.payload.new,
            });
          }
          break;
      }
    }

    // Update board timestamp
    await ctx.db.patch(boardId, { updatedAt: Date.now() });
  },
});

/**
 * Deletes multiple footprints by ID.
 */
export const deleteFootprints = mutation({
  args: { ids: v.array(v.id("pcb_footprints")) },
  handler: async (ctx: MutationCtx, args: { ids: Id<"pcb_footprints">[] }) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});
