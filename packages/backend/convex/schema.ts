import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  schematics: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    lastUpdated: v.number(),
  }),

  shapes: defineTable({
    schematicId: v.id("schematics"),
    tldrawId: v.string(), // e.g. "shape:some-id"
    type: v.string(),
    x: v.number(),
    y: v.number(),
    rotation: v.number(),
    index: v.string(),
    parentId: v.string(),
    isLocked: v.boolean(),
    opacity: v.number(),
    props: v.any(),
    meta: v.any(),
  })
  .index("by_schematicId", ["schematicId"])
  .index("by_tldrawId_schematicId", ["tldrawId", "schematicId"]),

  bindings: defineTable({
    schematicId: v.id("schematics"),
    tldrawId: v.string(), // e.g. "binding:some-id"
    type: v.string(),
    fromId: v.string(),
    toId: v.string(),
    props: v.any(),
    meta: v.any(),
  })
  .index("by_schematicId", ["schematicId"])
  .index("by_tldrawId_schematicId", ["tldrawId", "schematicId"]),
});

