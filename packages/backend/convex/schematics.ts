import { mutation, query, MutationCtx, QueryCtx } from "./_generated/server.js";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel.js";

/**
 * Fetches all schematic documents.
 */
export const list = query({
  args: {},
  handler: async (ctx: QueryCtx, args: {}) => {
    return await ctx.db.query("schematics").collect();
  },
});

/**
 * Fetches a single schematic by ID.
 */
export const getById = query({
  args: { id: v.id("schematics") },
  handler: async (ctx: QueryCtx, args: { id: Id<"schematics"> }) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Fetches all tldraw records (shapes and bindings) for a schematic.
 */
export const getRecords = query({
  args: { schematicId: v.id("schematics") },
  handler: async (ctx: QueryCtx, args: { schematicId: Id<"schematics"> }) => {
    const shapes = await ctx.db
      .query("shapes")
      .withIndex("by_schematicId", (q: any) => q.eq("schematicId", args.schematicId))
      .collect();

    const bindings = await ctx.db
      .query("bindings")
      .withIndex("by_schematicId", (q: any) => q.eq("schematicId", args.schematicId))
      .collect();

    return { shapes, bindings };
  },
});

/**
 * Creates a new schematic design.
 */
export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()) },
  handler: async (ctx: MutationCtx, args: { name: string; description?: string }) => {
    return await ctx.db.insert("schematics", {
      name: args.name,
      description: args.description,
      lastUpdated: Date.now(),
    });
  },
});

/**
 * Incremental sync for shapes and bindings.
 * Handles adding, updating, and removing individual records.
 */
export const sync = mutation({
  args: {
    schematicId: v.id("schematics"),
    updates: v.array(v.any()), // Array of tldraw records
    deletions: v.array(v.string()), // Array of tldrawIds (e.g. "shape:abc")
  },
  handler: async (ctx: MutationCtx, args: { schematicId: Id<"schematics">; updates: any[]; deletions: string[] }) => {
    const { schematicId, updates, deletions } = args;
    const deletedShapeIds = new Set(deletions.filter((id) => typeof id === "string" && id.startsWith("shape")));
    const updatedIds = new Set(
      updates
        .filter((record) => typeof record?.id === "string")
        .map((record) => record.id)
    );

    // If a component is deleted, any existing wires/bindings still pointing at it are stale.
    // Keep records that are explicitly updated in this same sync call; replacements re-bind
    // existing wire IDs this way.
    if (deletedShapeIds.size > 0) {
      const shapes = await ctx.db
        .query("shapes")
        .withIndex("by_schematicId", (q: any) => q.eq("schematicId", schematicId))
        .collect();

      for (const shape of shapes) {
        if (updatedIds.has(shape.tldrawId)) continue;

        const startShapeId = shape.props?.startBinding?.shapeId;
        const endShapeId = shape.props?.endBinding?.shapeId;
        if (shape.type === "wire" && (deletedShapeIds.has(startShapeId) || deletedShapeIds.has(endShapeId))) {
          console.log(`[Backend] Sync Cleanup: Deleting stale wire ${shape.tldrawId} connected to deleted shape.`);
          await ctx.db.delete(shape._id);
        }
      }

      const bindings = await ctx.db
        .query("bindings")
        .withIndex("by_schematicId", (q: any) => q.eq("schematicId", schematicId))
        .collect();

      for (const binding of bindings) {
        if (updatedIds.has(binding.tldrawId)) continue;
        if (deletedShapeIds.has(binding.fromId) || deletedShapeIds.has(binding.toId)) {
          console.log(`[Backend] Sync Cleanup: Deleting stale binding ${binding.tldrawId} connected to deleted shape.`);
          await ctx.db.delete(binding._id);
        }
      }
    }

    // Handle Deletions
    for (const tldrawId of deletions) {
      if (typeof tldrawId !== "string") continue;
      console.log(`[Backend] Sync Deletion: Attempting to delete ${tldrawId} from schematic ${schematicId}`);
      const table = tldrawId.startsWith('shape') ? 'shapes' : 'bindings' as any;
      const existing = await ctx.db
        .query(table)
        .withIndex("by_tldrawId_schematicId", (q: any) => q.eq("tldrawId", tldrawId).eq("schematicId", schematicId))
        .unique();
      
      if (existing) {
        console.log(`[Backend] Sync Deletion: Found record! Convex ID: ${existing._id}. Deleting now...`);
        await ctx.db.delete(existing._id);
      } else {
        console.log(`[Backend] Sync Deletion: WARNING - Could not find record with tldrawId ${tldrawId} in table ${table}`);
      }
    }

    // Handle Updates/Inserts
    for (const record of updates) {
      if (!record) continue;

      if (typeof record.id !== "string" || !record.id) {
        // Agent hallucinated or forgot to include an ID, auto-generate one
        record.id = record.type === "binding" ? `binding:${crypto.randomUUID()}` : `shape:${crypto.randomUUID()}`;
      }

      if (record.id.startsWith('shape')) {
        const existing = await ctx.db
          .query("shapes")
          .withIndex("by_tldrawId_schematicId", (q) => q.eq("tldrawId", record.id).eq("schematicId", schematicId))
          .unique();

        const shapeData = {
          schematicId,
          tldrawId: record.id,
          type: record.type,
          x: record.x ?? 0,
          y: record.y ?? 0,
          rotation: record.rotation ?? 0,
          index: record.index ?? "a1",
          parentId: record.parentId ?? "page:page",
          isLocked: record.isLocked ?? false,
          opacity: record.opacity ?? 1,
          props: {
            color: "black",
            dash: "draw",
            size: "m",
            fill: "none",
            font: "draw",
            align: "middle",
            spline: "line",
            ...(record.props || {})
          },
          meta: record.meta ?? {},
        };

        if (existing) {
          await ctx.db.patch(existing._id, shapeData);
        } else {
          await ctx.db.insert("shapes", shapeData);
        }
      } else if (record.id.startsWith('binding')) {
        const existing = await ctx.db
          .query("bindings")
          .withIndex("by_tldrawId_schematicId", (q) => q.eq("tldrawId", record.id).eq("schematicId", schematicId))
          .unique();

        const bindingData = {
          schematicId,
          tldrawId: record.id,
          type: record.type,
          fromId: record.fromId,
          toId: record.toId,
          props: record.props ?? {},
          meta: record.meta ?? {},
        };

        if (existing) {
          await ctx.db.patch(existing._id, bindingData);
        } else {
          await ctx.db.insert("bindings", bindingData);
        }
      }
    }

    // Update schematic timestamp
    await ctx.db.patch(schematicId, { lastUpdated: Date.now() });
  },
});

/**
 * Updates the sheet size and preset for a schematic.
 */
export const updateSheet = mutation({
  args: {
    id: v.id("schematics"),
    width: v.number(),
    height: v.number(),
    preset: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { id: Id<"schematics">; width: number; height: number; preset: string }) => {
    return await ctx.db.patch(args.id, {
      sheetWidth: args.width,
      sheetHeight: args.height,
      sheetPreset: args.preset,
      lastUpdated: Date.now(),
    });
  },
});
/**
 * Updates the camera state for a schematic.
 */
export const updateCamera = mutation({
  args: {
    id: v.id("schematics"),
    x: v.number(),
    y: v.number(),
    zoom: v.number(),
  },
  handler: async (ctx: MutationCtx, args: { id: Id<"schematics">; x: number; y: number; zoom: number }) => {
    return await ctx.db.patch(args.id, {
      cameraX: args.x,
      cameraY: args.y,
      cameraZoom: args.zoom,
      lastUpdated: Date.now(),
    });
  },
});
